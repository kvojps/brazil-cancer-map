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
  address.replaceVisit(null, `${HOME}?tipo=mama`);
  address.pushVisit(null, `${HOME}?visualizacao=lista`);
  history.back();
  assert.equal(history.length, 2);
  assert.equal(history.url, `${HOME}?tipo=mama`);
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
  const { history, navigations } = setup(memoryHistory(`${HOME}?tipo=mama&visualizacao=tabela`));
  assert.equal(history.length, 1);
  assert.equal(history.url, `${HOME}?tipo=mama`);
  assert.equal(navigations[0].view, 'map');
  assert.equal(navigations[0].url.href, `${HOME}?tipo=mama`);
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
