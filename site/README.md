# Site e plataforma Criativos Rápidos

Site estático (HTML, CSS e JS puro, sem build) + Supabase para login, banco e arquivos.

- Passo a passo para publicar: [COMO-SUBIR.md](COMO-SUBIR.md)
- Configuração: `assets/config.js` (sem chaves = modo demonstração)
- Banco: `supabase/schema.sql`
- Camada de dados: `assets/core.js` (Supabase ou demonstração com localStorage)
- Biblioteca `assets/vendor/supabase.js`: @supabase/supabase-js 2.45.4 (UMD)
- Páginas: `index.html` (home), `videos.html` (campanha dos vídeos), `brief.html`, `entrar.html`, `app.html` (app do cliente, instalável), `admin.html` (painel)
- Ícones de traço do app e do painel: `assets/icons.js`
- Imagens e vídeos de exemplo (marcas fictícias): `assets/demo`, `assets/videos`, `assets/img`, gerados por `../site-fontes`
