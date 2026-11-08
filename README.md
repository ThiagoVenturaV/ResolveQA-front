# Mola · ResolveQA Front

Frontend experimental para acompanhar trabalho em um Kanban com uma mola de brinquedo em pixel art. A mola transporta os cards entre **A fazer**, **Em andamento** e **Concluído**.

## Demo pública (AWS)

| Superfície | URL |
|---|---|
| Front (CloudFront) | https://d10ry6ff7l79jo.cloudfront.net |
| Quadro | https://d10ry6ff7l79jo.cloudfront.net/quadro |
| Admin | https://d10ry6ff7l79jo.cloudfront.net/admin |
| Backend ResolveQA | https://d2f79ulrlhg51j.cloudfront.net |
| Backend health | https://d2f79ulrlhg51j.cloudfront.net/health |

Stack do front: `resolveqa-frontend`. Deploy via `infra/aws` / CI na `main`. O Admin pode carregar custo LLM (USD estimate) de `GET {backend}/api/cases/<case_id>/usage` quando o endpoint existir no deploy.

## Rodar

Requer Node.js 22.13+ e npm.

```sh
npm ci
npm run dev
```

Abra http://localhost:5173. Para gerar a versão de produção:

```sh
npm run build
npm run start
```

## O que explorar

- Uma mola arco-íris, com seis opções de matiz da mesma arte.
- Avanço manual, reprodução automática pausável e arrastar/soltar cards.
- Criação de tarefas, filtro por agente, detalhes e registro de eventos.
- Estado salvo no navegador, importação e exportação de snapshots JSON.
- Layout responsivo, navegação por teclado e redução de movimento conforme a preferência do sistema.
- Duas pranchas de direção visual com variantes e estudos de animação.

O quadro inicia em **modo demonstração**. Os nomes dos agentes e as tarefas iniciais são ilustrativos. Os eventos registram interações desta sessão; não há conexão ativa ao GitHub, ao Maestri ou a um serviço de agentes. Um snapshot importado continua sendo uma cópia local dos dados.

## Direção visual

A referência de movimento é a landing da [Keytotwo](https://keytotwo.com.br/). A identidade da Mola, as pranchas e o atlas foram gerados para este projeto.

| Prancha | Explorações |
| --- | --- |
| [Playful Paper](public/moodboards/mola-paper.png) | Lima, Tangerina, Lavanda |
| [After Hours](public/moodboards/mola-night.png) | Cromo, Fliperama, Azul |

![Mola — Playful Paper](public/moodboards/mola-paper.png)
![Mola — After Hours](public/moodboards/mola-night.png)

O personagem usa um atlas gerado por estado, baseado no desenho da primeira prancha. O transporte adapta a interação da segunda prancha. Veja [arte, movimento e evidências](docs/rainbow-mascot.md).

## Fonte

- `app/quadro/page.tsx`: estado do quadro e interações.
- `app/admin/page.tsx`: métricas locais + painel de custo LLM (USD estimate).
- `app/globals.css`: composição, responsividade e movimento.
- `components/mola/`: atlas, física, palco interativo e transporte.
- `public/moodboards/`: pranchas PNG em resolução original.
- [Contrato de snapshot](docs/snapshots.md): formato de intercâmbio local.
- [Direção visual](docs/art-direction.md): decisões e contexto.
- [AWS frontend](infra/aws/README.md): export estático + CloudFront.

Implementado com React, TypeScript e Vinext/Vite. O starter inclui a configuração de publicação privada pelo Sites; não há credenciais de GitHub no cliente.

