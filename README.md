# Sistema de Cadastro de Usuários 🚀

Um sistema de cadastro de usuários desenvolvido em React, com foco em validações de dados, persistência de informações e melhoria da experiência do usuário.

A aplicação permite cadastrar, editar, excluir e gerenciar usuários, além de realizar a busca automática de endereço através do CEP utilizando uma API externa.

## Funcionalidades ✨

* Cadastro de usuários
* Edição de usuários
* Exclusão de usuários
* Persistência dos dados utilizando LocalStorage
* Validação e máscara de CPF
* Validação e máscara de CEP
* Busca automática de endereço através do CEP (ViaCEP)
* Preenchimento automático de:

  * Rua
  * Bairro
  * Cidade
  * Estado
* Cadastro do número da residência
* Verificação de dados duplicados:

  * Nome
  * Email
  * CPF
* Mensagens de sucesso após ações realizadas
* Animação de comemoração após cadastro realizado com sucesso 🎉

## Tecnologias utilizadas 💻

* React
* JavaScript
* HTML5
* CSS3
* Vite
* API ViaCEP
* LocalStorage

## Validações implementadas 🛡️

* Campos obrigatórios
* Validação de nome
* Validação de email
* Validação matemática de CPF
* Validação de CEP
* Bloqueio de cadastros duplicados

## Objetivo do projeto 🎯

Este projeto foi desenvolvido para praticar conceitos de desenvolvimento Front-End, consumo de APIs, manipulação de estados no React e boas práticas de desenvolvimento.

Também possui foco em qualidade de software, aplicando validações e testes de comportamento para garantir uma melhor experiência ao usuário.

## Como executar o projeto

Clone o repositório:

```bash
git clone URL_DO_REPOSITORIO
```

Instale as dependências:

```bash
npm install
```

Execute o projeto:

```bash
npm run dev
```

## Autor

Projeto desenvolvido para estudos e construção de portfólio na área de desenvolvimento de software.
