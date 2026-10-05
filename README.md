# Protótipo — plataforma de ingressos ("palco.")

Protótipo navegável de uma plataforma de venda de ingressos no estilo Sympla, com taxa de serviço menor e **seleção de lugares no estilo de compra de passagem de ônibus** (Embarca Aí).

## Como abrir

Não precisa instalar nada: dê dois cliques em `index.html` (ou arraste para o navegador).

Os dados ficam salvos no próprio navegador (localStorage). Para voltar aos eventos de exemplo, use **"Restaurar dados de demonstração"** no rodapé.

## Celular e web

O protótipo é **mobile-first**: no celular (até 760px de largura) ele funciona como um app, e em telas maiores vira a versão web.

| No celular | Na web |
|---|---|
| Barra de abas embaixo (Explorar · Ingressos · Criar · Produtor) e botão voltar no topo | Menu no topo |
| Destaques em carrossel deslizável; agenda em lista compacta; categorias roláveis | Destaque grande ao lado da busca; agenda em grade |
| Barra de compra fixa no rodapé com lugares escolhidos e total | Resumo do pedido na lateral |
| Checkout e prévias abrem como folha que sobe de baixo | Janela (modal) centralizada |
| Mapa de lugares com poltronas do tamanho do dedo e rolagem lateral | Mapa completo |
| Editor do mapa com pincéis grudados no topo e ferramenta **Mover mapa** (rolar sem pintar) | Editor com painel lateral |

Para testar no computador, abra o DevTools do navegador (F12) e ative o modo de dispositivo (Ctrl+Shift+M). Servido por HTTP, também pode ser "instalado" na tela inicial do celular (`manifest.webmanifest`).

## Telas

| Página | O que mostra |
|---|---|
| `index.html` | Home: busca, filtro por cidade, carrossel de destaques, categorias e lista de eventos |
| `evento.html` | Página do evento: mapa de lugares (disponível / selecionado / ocupado com X), resumo do pedido com taxa e checkout simulado (Pix ou cartão) |
| `criar-evento.html` | Assistente em 4 passos: informações e banner → data e local → ingressos → revisão e publicação |
| `meus-ingressos.html` | Ingressos comprados, com lugar e QR code |
| `meus-eventos.html` | Painel do organizador: vendidos, receita e mapa de ocupação |

### Editor do mapa de lugares (criar evento → passo 3)

- Modelos prontos: **Teatro**, **Auditório** ou **Em branco**
- Ajuste de fileiras e colunas
- Pincéis: cada **setor** (com nome, cor e preço próprios), **Corredor** (espaço vazio) e **Bloquear** (lugar que não será vendido)
- Clique ou arraste sobre o mapa para pintar (funciona também com toque)
- Fileiras (A, B, C…) e números dos assentos são gerados automaticamente
- Contagem de lugares por setor e receita estimada se esgotar
- Botão "Ver como o comprador verá"

Também dá para criar eventos sem lugar marcado (**Ingresso geral**: pista, camarote, lotes).

## Configuração

Em `js/data.js`, objeto `CONFIG`:

- `nome`: nome provisório da plataforma
- `taxa`: taxa de serviço cobrada do comprador (padrão `0.05` = 5%)
- `maxPorCompra`: limite de ingressos por pedido

## Limitações (é um protótipo)

- Sem backend: pagamentos, e-mails e login são simulados; os dados ficam só no navegador.
- O QR code é ilustrativo.
- Para produção será preciso: servidor + banco de dados, gateway de pagamento (Pix/cartão), reserva temporária do lugar durante o pagamento (evitar dois compradores no mesmo assento), autenticação e emissão de ingressos válidos.
