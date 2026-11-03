# 03: Publicação no Cloudflare Pages

**What to build:** o site fica acessível publicamente no subdomínio gratuito da hospedagem (por exemplo `*.pages.dev`), com deploy feito só por `astro build`, sem custo. Requer criar a conta e o projeto na hospedagem, por isso fica com um humano. GitHub Pages é a alternativa equivalente se o Cloudflare não servir. Referência: spec, seções 2 e 13.

**Blocked by:** 02 — Tracer bullet: malha IBGE até o mapa no site

**Status:** resolved

- [x] Projeto criado no Cloudflare Pages, ligado ao repositório público
- [x] Cada push na branch principal publica o site com `astro build`
- [x] O mapa do ticket 02 abre no endereço público
- [x] Nada na configuração gera custo
- [x] O endereço escolhido fica registrado no README

## Comments

O painel da Cloudflare não oferece mais a criação de projetos Pages, só de Workers. O site foi publicado como Worker com assets estáticos, também gratuito e com os mesmos limites (20.000 arquivos de até 25 MiB). O endereço é `https://brazil-cancer-map.josebazjunior09.workers.dev`, e o primeiro deploy (versão `e7aa7b98`) foi em 2026-11-03. A configuração de build e deploy está no README.

Resolvido no commit que registra o endereço e a configuração no README e fecha este ticket.
