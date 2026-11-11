# exame-de-consciencia

Site para fazer exame de consciência católico a partir dos Dez Mandamentos, usado para preparar a
Confissão. Funciona como app instalável (PWA) e **não envia nenhum dado para servidor**: tudo fica no
aparelho de quem usa.

Publicado em: https://rodrigo-fullstack.github.io/exame-de-consciencia/

## O que faz

- 10 mandamentos, 57 perguntas, com detalhe opcional por pergunta (quantidade, texto livre, pecados extras).
- Lista "Para levar à Confissão", com cópia para a área de transferência.
- Histórico de exames por data, com gráfico, média e comparação com o exame anterior.
- 5 temas litúrgicos (Santa Dulce, Tempo Comum, Advento/Quaresma, Natal/Páscoa, Pentecostes) e modo claro/escuro.
- Cópia de segurança em arquivo `.json` (exportar/restaurar) e botão para apagar todos os dados.
- Funciona offline depois da primeira visita (service worker).

## Como rodar localmente

O jeito mais fiel ao publicado é servir por HTTP (o service worker não roda em `file://`):

```bash
python -m http.server 8000
# abra http://localhost:8000
```

Abrir `index.html` direto também funciona para testar a interface; só o modo offline/instalação
não estará disponível.

## Onde ficam os dados (e quando se perdem)

Tudo é gravado no `localStorage` do navegador, com estas chaves:

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
manifest.json   metadados da PWA
sw.js           service worker (cache versionado)
icon.svg        ícone vetorial
icon-192.png    ícone PWA / iOS
icon-512.png    ícone PWA
```

## Publicar uma versão nova

1. Altere `index.html`.
2. **Incremente `CACHE` em `sw.js`** (`"exame-v1"` → `"exame-v2"`). Se esquecer, quem já visitou
   continua recebendo a versão antiga do cache.
3. Faça commit em `main`; o GitHub Pages publica automaticamente.

## Licença

Ainda não definida. Sem um arquivo `LICENSE`, vale o padrão de "todos os direitos reservados".
