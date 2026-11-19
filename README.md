# exame-de-consciencia

Site para fazer exame de consciência católico a partir dos Dez Mandamentos, usado para preparar a
Confissão. Funciona como app instalável (PWA). **Os exames, o histórico e as preferências ficam no
aparelho de quem usa.** O cadastro público de igrejas usa um banco compartilhado.

Publicado em: https://exame-de-consciencia-rose.vercel.app/

## O que faz

- 10 mandamentos, 57 perguntas, com detalhe opcional por pergunta (quantidade, texto livre, pecados extras).
- Lista "Para levar à Confissão", com cópia para a área de transferência.
- Histórico de exames por data, com gráfico, média e comparação com o exame anterior.
- 5 temas litúrgicos (Santa Dulce, Tempo Comum, Advento/Quaresma, Natal/Páscoa, Pentecostes) e modo claro/escuro.
- Cópia de segurança em arquivo `.json` (exportar/restaurar) e botão para apagar todos os dados.
- Funciona offline depois da primeira visita (service worker).
- Diretório público de igrejas para confissão, com horários, endereço por campo e link para o mapa.

## Como rodar localmente

O jeito mais fiel ao publicado é servir por HTTP (o service worker não roda em `file://`):

```bash
python -m http.server 8000
# abra http://localhost:8000
```

Abrir `index.html` direto também funciona para testar a interface; só o modo offline/instalação
não estará disponível.

## Configurar o cadastro público de igrejas

1. No SQL Editor de um projeto Supabase, execute as migrações em `supabase/migrations/` por ordem de nome.
2. Preencha `projectUrl` e `publishableKey` em `igrejas.js` com a URL e a chave publicável do projeto.
3. Sirva o site por HTTP para testar. O Vercel publica o site a partir da branch `main` do GitHub.

O cadastro e a consulta precisam de internet. Qualquer visitante pode cadastrar igrejas sem conta,
e os registros aparecem na lista assim que são salvos. Correções e exclusões podem ser feitas pela
administração do banco.

## Onde ficam os dados pessoais (e quando se perdem)

Os dados pessoais são gravados no `localStorage` do navegador, com estas chaves:

| Chave | Conteúdo |
|---|---|
| `exame-consciencia-v5` | exame em andamento (`s` = marcações, `i` = detalhes) |
| `exame-consciencia-hist-v2` | exames salvos, por data |
| `exame-consciencia-v4` / `hist-v1` | formato antigo, mantido após a migração como rede de segurança |
| `exame-consciencia-tema` / `-paleta` | preferências |
| `exame-consciencia-ultima-copia` | data da última cópia exportada |

O que acontece com cada tipo de limpeza:

| Ação | Histórico | Dados do app | Arquivo exportado |
|---|---|---|---|
| Limpar apenas "Histórico" | apaga | mantém | mantém |
| Limpar "Cookies e dados de sites" | mantém | **apaga** | mantém |
| "Limpar tudo" / modo anônimo | apaga | **apaga** | mantém |
| Navegador com pouco espaço | — | **pode apagar** | mantém |
| Safari, 7 dias sem interação | — | **pode apagar** | mantém |
| Trocar de aparelho | — | não acompanha | mantém, se você levar o arquivo |

Resumo honesto: **não existe garantia** de que o navegador nunca apague. O app pede armazenamento
persistente (`navigator.storage.persist()`) para reduzir a limpeza automática, mas o usuário sempre
pode limpar. A cópia em arquivo é a única rede de segurança real.

## Migração de dados

A versão anterior identificava cada pergunta por posição (`"3-2"`). Agora cada pergunta tem um id
estável (`"m4-deixei-cuidar-educacao"`). Na primeira carga, `migrate()` converte as chaves antigas
(`exame-consciencia-v4` e `hist-v1`) para o formato novo. Os dados antigos **não são apagados** —
ficam como segunda cópia até você usar "Apagar tudo".

Por isso, a partir de agora, **não reordene as perguntas sem migrar o histórico antes**: os ids
protegem contra reordenação, mas a migração de quem ainda está na v4 depende da ordem atual.

## Estrutura

```
index.html      aplicativo completo (HTML + CSS + JS, sem build)
igrejas.js      integração do diretório público com o Supabase
manifest.json   metadados da PWA
sw.js           service worker (cache versionado)
icon.svg        ícone vetorial
icon-192.png    ícone PWA / iOS
icon-512.png    ícone PWA
```

## Publicar uma versão nova

Envie as alterações para `main` no GitHub. O Vercel publica automaticamente os arquivos estáticos
listados em `vercel.json`.

O `sw.js` usa **network-first** para o HTML: quem está online recebe sempre a versão publicada, e o
cache só entra quando a rede falha (offline). Por isso **não é preciso mexer em `CACHE` a cada deploy**.

Bumpe `"exame-v2"` → `"exame-v3"` apenas quando mudar a estratégia de cache ou a lista de `ASSETS`:
o `activate` apaga os caches antigos e todo mundo passa a usar a caixa nova.

## Licença

Ainda não definida. Sem um arquivo `LICENSE`, vale o padrão de "todos os direitos reservados".
