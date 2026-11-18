export function mountMunicipalityShare(
  control: HTMLElement,
  getShareData: () => { title: string; url: string } | undefined,
): () => void {
  const button = control.querySelector('button')!;
  const status = control.querySelector<HTMLElement>('[role="status"]')!;
  const field = control.querySelector('input')!;
  let request = 0;
  let confirmationTimer: number | undefined;
  const reset = () => {
    request++;
    window.clearTimeout(confirmationTimer);
    status.textContent = '';
    field.hidden = true;
    field.value = '';
  };
  control.hidden = false;
  button.onclick = async () => {
    const data = getShareData();
    if (!data) return;
    reset();
    const pending = request;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    if (pending !== request) return;
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(data.url);
        if (pending === request) {
          status.textContent = 'Link copiado';
          confirmationTimer = window.setTimeout(() => { status.textContent = ''; }, 3000);
        }
        return;
      } catch {
        // Offer the address for manual copying if the clipboard is unavailable.
      }
    }
    if (pending !== request) return;
    field.value = data.url;
    field.hidden = false;
    field.focus();
    field.select();
  };
  return reset;
}
