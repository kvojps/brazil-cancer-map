# 03: Publicação no Cloudflare Pages

**What to build:** o site fica acessível publicamente no subdomínio gratuito da hospedagem (por exemplo `*.pages.dev`), com deploy feito só por `astro build`, sem custo. Requer criar a conta e o projeto na hospedagem, por isso fica com um humano. GitHub Pages é a alternativa equivalente se o Cloudflare não servir. Referência: spec, seções 2 e 13.

**Blocked by:** 02 — Tracer bullet: malha IBGE até o mapa no site

**Status:** ready-for-human

- [ ] Projeto criado no Cloudflare Pages, ligado ao repositório público
- [ ] Cada push na branch principal publica o site com `astro build`
- [ ] O mapa do ticket 02 abre no endereço público
- [ ] Nada na configuração gera custo
- [ ] O endereço escolhido fica registrado no README
