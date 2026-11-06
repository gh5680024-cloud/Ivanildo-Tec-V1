# Ivanildo Tec — Controle de Estoque e Projetos

Sistema web para controlar o estoque e os projetos de um negócio real, a Ivanildo Tec. Ele substitui o controle manual por um painel onde cada projeto consome os produtos do estoque de forma automática.

**Site no ar:** https://ivanildotec.netlify.app/

## O que o sistema faz

- Login por usuário (autenticação)
- Cadastro e controle de **produtos** em estoque
- Cadastro de **projetos** e dos itens usados em cada um
- Ao **finalizar um projeto**, a baixa no estoque é feita automaticamente
- Dados atualizados em **tempo real**, sem precisar recarregar a página

## Tecnologias

| Parte | Tecnologia |
|---|---|
| Interface | HTML, CSS e JavaScript |
| Banco de dados e autenticação | Supabase (PostgreSQL) |
| Hospedagem | Netlify |

## Como o banco está organizado

- `produtos`: itens do estoque
- `projetos`: projetos cadastrados
- `projeto_itens`: quais produtos (e quantos) cada projeto usa

A regra de finalizar o projeto e dar baixa no estoque roda em uma **função no próprio banco**, o que evita inconsistências entre o que foi usado e o que sobra.

## Como rodar localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/gh5680024-cloud/ivanildo-tec-estoque.git
   ```
2. Abra a pasta e crie seu próprio projeto no [Supabase](https://supabase.com), com as três tabelas acima.
3. Configure a URL e a chave pública (anon) do seu projeto Supabase no arquivo de configuração do JavaScript.
4. Abra o `index.html` no navegador.

> Nunca publique chaves privadas (`service_role`) no repositório.

## Próximos passos

- Relatórios de uso e de estoque
- Mais níveis de permissão por usuário

## Autor

**Gabriel Henrique** — estudante de Análise e Desenvolvimento de Sistemas (Estácio)
GitHub: [gh5680024-cloud](https://github.com/gh5680024-cloud)
