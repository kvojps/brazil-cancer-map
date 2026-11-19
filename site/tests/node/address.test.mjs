import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAddress, memoryHistory } from '../../src/map/address.ts';

const HOME = 'https://example.org/';

/** An Address over an in-memory history, with every navigation it delivered. */
function setup(history = memoryHistory(HOME)) {
  const address = createAddress(history);
  const navigations = [];
  address.listen(navigation => navigations.push(navigation));
  return { history, address, navigations };
}

test('the reading context left behind comes back with the entry', () => {
  const { history, address, navigations } = setup();
  let scroll = 120;
  address.registerContext('view', () => ({ page: scroll }));
  address.pushVisit(null, `${HOME}?visualizacao=lista`);
  scroll = 40;
  history.back();
  assert.equal(history.url, HOME);
  assert.deepEqual(navigations.at(-1).context.view, { page: 120 });
  history.forward();
  assert.equal(history.url, `${HOME}?visualizacao=lista`);
  assert.deepEqual(navigations.at(-1).context.view, { page: 40 });
});

test('an entry this document never left has no reading context', () => {
  const { history, address, navigations } = setup();
  address.registerContext('view', () => ({ page: 120 }));
  history.setHash('#eixo-tratamento');
  assert.equal(history.length, 2);
  assert.equal(navigations.at(-1).context.view, undefined);
});

test('the reading context lasts only for the document that saved it', () => {
  const first = setup();
  first.address.registerContext('list', () => ({ uf: 'PE' }));
  first.address.pushVisit(null, `${HOME}?visualizacao=lista`);
  first.history.reload();
  const { history, address, navigations } = setup(first.history);
  address.registerContext('list', () => ({ uf: 'SP' }));
  history.back();
  assert.equal(navigations.at(-1).context.list, undefined);
  history.forward();
  assert.deepEqual(navigations.at(-1).context.list, { uf: 'SP' });
});

test('the handler is told the page started, then that Back and Forward moved it', () => {
  const { history, address, navigations } = setup();
  address.pushVisit(null, `${HOME}?visualizacao=lista`);
  history.back();
  history.forward();
  assert.deepEqual(navigations.map(({ cause, url }) => [cause, url.href]), [
    ['initial', HOME],
    ['back', HOME],
    ['back', `${HOME}?visualizacao=lista`],
  ]);
});

test('each named part gets back only its own context', () => {
  const { history, address, navigations } = setup();
  address.registerContext('view', () => ({ page: 10 }));
  address.registerContext('list', () => ({ uf: 'BA' }));
  address.pushVisit(null, `${HOME}?indicador=mortalidade`);
  history.back();
  assert.deepEqual(navigations.at(-1).context, { view: { page: 10 }, list: { uf: 'BA' } });
});

test('rewriting the entry keeps its reading context and adds no entry', () => {
  const { history, address, navigations } = setup();
  address.registerContext('view', () => ({ page: 75 }));
  address.replaceVisit(null, `${HOME}?tipo=breast`);
  address.pushVisit(null, `${HOME}?visualizacao=lista`);
  history.back();
  assert.equal(history.length, 2);
  assert.equal(history.url, `${HOME}?tipo=breast`);
  assert.deepEqual(navigations.at(-1).context.view, { page: 75 });
});

test('choosing a visualization adds an entry only when the address changes', () => {
  const { history, address } = setup();
  address.chooseView('map');
  assert.equal(history.length, 1);
  address.chooseView('list');
  assert.equal(history.length, 2);
  assert.equal(history.url, `${HOME}?visualizacao=lista`);
  address.chooseView('list');
  assert.equal(history.length, 2);
  address.chooseView('map');
  assert.equal(history.length, 3);
  assert.equal(history.url, HOME);
});

test('an unknown visualization on load is the map, dropped from the address without an entry', () => {
  const { history, navigations } = setup(memoryHistory(`${HOME}?tipo=breast&visualizacao=tabela`));
  assert.equal(history.length, 1);
  assert.equal(history.url, `${HOME}?tipo=breast`);
  assert.equal(navigations[0].view, 'map');
  assert.equal(navigations[0].url.href, `${HOME}?tipo=breast`);
});

test('the List on load is kept and delivered as the List', () => {
  const { history, navigations } = setup(memoryHistory(`${HOME}?visualizacao=lista`));
  assert.equal(history.url, `${HOME}?visualizacao=lista`);
  assert.equal(navigations[0].view, 'list');
});

test('Back and Forward deliver the visualization of the entry, with the reading context left there', () => {
  const { history, address, navigations } = setup();
  let page = 300;
  address.registerContext('view', () => ({ page }));
  address.chooseView('list');
  page = 50;
  history.back();
  assert.equal(navigations.at(-1).view, 'map');
  assert.deepEqual(navigations.at(-1).context.view, { page: 300 });
  history.forward();
  assert.equal(navigations.at(-1).view, 'list');
  assert.deepEqual(navigations.at(-1).context.view, { page: 50 });
});

test('choosing the visualization already shown adds no entry, however the address is written', () => {
  const { history, address } = setup(memoryHistory(`${HOME}municipio/261160-recife/?busca=s%C3%A3o%20jos%C3%A9&visualizacao=lista`));
  address.chooseView('list');
  assert.equal(history.length, 1);
});

test('an invalid map state on load is corrected on the address without an entry', () => {
  const { history, navigations } = setup(memoryHistory(`${HOME}?indicador=hpv&tipo=prostate&modo=hoje&theme=dark`));
  assert.equal(history.length, 1);
  assert.equal(history.url, `${HOME}?theme=dark&tipo=prostate`);
  assert.deepEqual(navigations[0].mapState, { indicator: 'within_60_days', cancerType: 'prostate', mode: 'trend' });
});

test('a #tipo- link on load becomes the cancer type, and the hash leaves the address', () => {
  const { history, navigations } = setup(memoryHistory(`${HOME}?visualizacao=lista#tipo-breast`));
  assert.equal(history.length, 1);
  assert.equal(history.url, `${HOME}?visualizacao=lista&tipo=breast`);
  assert.equal(navigations[0].mapState.cancerType, 'breast');
});

test('a #tipo- hash for an unknown cancer type on load is dropped, keeping the cancer type', () => {
  const { history, navigations } = setup(memoryHistory(`${HOME}#tipo-x`));
  assert.equal(history.url, HOME);
  assert.equal(navigations[0].mapState.cancerType, 'all');
});

test('following a #tipo- link is a hash navigation to that cancer type, and Back undoes it', () => {
  const { history, navigations } = setup(memoryHistory(`${HOME}?indicador=mortality`));
  history.setHash('#tipo-cervix');
  assert.equal(history.length, 2);
  assert.equal(history.url, `${HOME}?indicador=mortality&tipo=cervix`);
  assert.equal(navigations.at(-1).cause, 'hash');
  assert.deepEqual(navigations.at(-1).mapState, { indicator: 'mortality', cancerType: 'cervix', mode: 'trend' });
  history.back();
  assert.equal(navigations.at(-1).cause, 'back');
  assert.equal(navigations.at(-1).mapState.cancerType, 'all');
});

test('following an Eixo anchor is still delivered as Back or Forward', () => {
  const { history, navigations } = setup();
  history.setHash('#acesso');
  assert.equal(history.url, `${HOME}#acesso`);
  assert.equal(navigations.at(-1).cause, 'back');
});

test('setting the map state adds an entry, and Back restores the combination before it', () => {
  const { history, address, navigations } = setup(memoryHistory(`${HOME}?visualizacao=lista`));
  address.setMapState({ indicator: 'mortality', cancerType: 'lung', mode: 'trend' });
  assert.equal(history.length, 2);
  assert.equal(history.url, `${HOME}?visualizacao=lista&indicador=mortality&tipo=lung`);
  address.setMapState({ indicator: 'within_60_days', cancerType: 'lung', mode: 'status' });
  assert.equal(history.url, `${HOME}?visualizacao=lista&tipo=lung&modo=hoje`);
  history.back();
  assert.deepEqual(navigations.at(-1).mapState, { indicator: 'mortality', cancerType: 'lung', mode: 'trend' });
  history.back();
  assert.deepEqual(navigations.at(-1).mapState, { indicator: 'within_60_days', cancerType: 'all', mode: 'trend' });
});

test('setting the map state already shown adds no entry', () => {
  const { history, address } = setup(memoryHistory(`${HOME}?tipo=breast`));
  address.setMapState({ indicator: 'within_60_days', cancerType: 'breast', mode: 'trend' });
  assert.equal(history.length, 1);
});

test('reset adds an entry for the default home map, delivered as a reset, and Back undoes it', () => {
  const start = `${HOME}municipio/261160-recife/?tipo=breast&visualizacao=lista`;
  const { history, address, navigations } = setup(memoryHistory(start));
  let uf = 'PE';
  address.registerContext('list', () => ({ uf }));
  address.reset(`${HOME}?theme=dark`);
  assert.equal(history.length, 2);
  assert.equal(history.url, `${HOME}?theme=dark`);
  const reset = navigations.at(-1);
  assert.equal(reset.cause, 'reset');
  assert.equal(reset.view, 'map');
  assert.deepEqual(reset.mapState, { indicator: 'within_60_days', cancerType: 'all', mode: 'trend' });
  assert.deepEqual(reset.context, {});
  uf = '';
  history.back();
  assert.equal(history.url, start);
  assert.deepEqual(navigations.at(-1).context.list, { uf: 'PE' });
});

test('reset on the default home map adds no entry, and is still delivered as a reset', () => {
  const { history, address, navigations } = setup();
  address.registerContext('list', () => ({ uf: 'PE' }));
  address.chooseView('list');
  history.back();
  address.reset(HOME);
  assert.equal(history.length, 2);
  assert.equal(history.index, 0);
  assert.equal(navigations.at(-1).cause, 'reset');
  assert.deepEqual(navigations.at(-1).context, {});
});

test('every write and every navigation sends one change signal, with its cause', () => {
  const { history, address } = setup();
  const changes = [];
  address.onChange(change => changes.push([change.cause, change.url.href]));
  address.setMapState({ indicator: 'mortality', cancerType: 'all', mode: 'trend' });
  address.setMapState({ indicator: 'mortality', cancerType: 'all', mode: 'trend' });
  address.chooseView('list');
  history.back();
  history.setHash('#tipo-lung');
  address.reset(HOME);
  address.reset(HOME);
  assert.deepEqual(changes, [
    ['command', `${HOME}?indicador=mortality`],
    ['command', `${HOME}?indicador=mortality&visualizacao=lista`],
    ['back', `${HOME}?indicador=mortality`],
    ['hash', `${HOME}?indicador=mortality&tipo=lung`],
    ['reset', HOME],
    ['reset', HOME],
  ]);
});

test('the anchor the visitor arrived with is delivered on load, even a #tipo- one the address drops', () => {
  const { history, navigations } = setup(memoryHistory(`${HOME}municipio/261160-recife/#tipo-breast`));
  assert.equal(history.url, `${HOME}municipio/261160-recife/?tipo=breast`);
  assert.equal(navigations[0].anchor, 'tipo-breast');
  history.setHash('#acesso');
  assert.equal(navigations.at(-1).anchor, 'acesso');
});

test('following a #tipo- link for an unknown cancer type is an ordinary hash navigation', () => {
  const { history, navigations } = setup();
  history.setHash('#tipo-x');
  assert.equal(history.url, `${HOME}#tipo-x`);
  assert.equal(navigations.at(-1).cause, 'back');
});
