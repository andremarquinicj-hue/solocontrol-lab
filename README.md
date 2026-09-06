# Solocontrol Lab

Sistema web/PWA para transformar a rotina de planilhas do laboratório Solocontrol em um fluxo profissional de **lançamento → cálculo → validação → relatório PDF → nuvem**.

## Entregue nesta V1

- Login com Firebase Authentication.
- Relatórios salvos no Cloud Firestore.
- PDF oficial salvo no Firebase Storage.
- Perfis previstos: `admin`, `coordenador`, `tecnico`.
- Dashboard de relatórios.
- Novo ensaio de granulometria.
- Seleção dinâmica **Padrão A / Padrão B**.
- A tela mostra somente as peneiras do padrão escolhido.
- Duas determinações (A1/A2).
- Cálculo automático de % retida, diferença, média, acumulada e passante.
- Repetibilidade de 4% por peneira.
- Balanço de massa de 0,3%.
- Enquadramento automático na faixa NBR 5564:2021.
- Resultado: CONFORME / NÃO CONFORME / REPETIR ENSAIO / PENDENTE.
- Gráfico SVG desenhado no padrão visual solicitado pela Ana.
- Relatório A4 com identidade Solocontrol, cabeçalho, gráfico e rodapé.
- Pré-validação antes da emissão.
- Geração de PDF.
- Upload do PDF oficial para a nuvem.
- Audit log de criação/alteração/emissão.

Leia também: `docs/REQUISITOS_ANA.md`.

---

# 1. Criar o projeto no GitHub

1. Entre no GitHub e clique em **New repository**.
2. Nome sugerido: `solocontrol-lab`.
3. Recomendo deixar **Private**.
4. Não marque README, .gitignore ou licença, porque o ZIP já contém esses arquivos.
5. Extraia o ZIP deste projeto no computador.
6. Abra a pasta no VS Code.
7. Abra o Terminal do VS Code e execute:

```bash
git init
git add .
git commit -m "Base Solocontrol Lab"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/solocontrol-lab.git
git push -u origin main
```

---

# 2. Criar o Firebase

## 2.1 Projeto

1. Acesse o Firebase Console.
2. **Criar projeto**.
3. Nome sugerido: `Solocontrol Lab`.
4. Depois, em **Visão geral do projeto**, clique no ícone `</>` para criar um **Web App**.
5. Nome do app: `Solocontrol Lab Web`.
6. Copie os dados do `firebaseConfig`.

## 2.2 Authentication

1. Firebase → **Authentication** → Começar.
2. **Sign-in method**.
3. Ative **Email/Password**.
4. Em **Users**, crie o primeiro usuário da Ana/administrador.

## 2.3 Firestore

1. Firebase → **Firestore Database** → Criar banco de dados.
2. Escolha a região adequada.
3. Pode iniciar em modo de produção.

## 2.4 Storage

1. Firebase → **Storage** → Começar.
2. Use a mesma região quando possível.

---

# 3. Configurar as variáveis do Firebase

Na raiz do projeto:

```bash
copy .env.example .env.local
```

No PowerShell também pode usar:

```powershell
Copy-Item .env.example .env.local
```

Preencha `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_COMPANY_ID=solocontrol
```

Nunca envie `.env.local` para o GitHub.

---

# 4. Criar o primeiro usuário administrador no Firestore

Depois de criar o usuário no Authentication:

1. Copie o **UID** dele.
2. Firestore → Start collection.
3. Collection ID: `users`.
4. Document ID: cole exatamente o UID.
5. Crie os campos:

```text
name       string   Ana
email      string   email-da-ana@...
role       string   admin
companyId  string   solocontrol
active     boolean  true
```

Para um técnico, use `role = tecnico`.
Para coordenação, `role = coordenador`.

---

# 5. Publicar as regras do Firebase

Instale as dependências do projeto:

```bash
npm install
```

Faça login no Firebase CLI:

```bash
npx firebase-tools login
```

Associe o projeto:

```bash
npx firebase-tools use --add
```

Escolha o projeto `Solocontrol Lab` e dê o alias `default`.

Publique regras e índices:

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

---

# 6. Testar localmente

```bash
npm run dev
```

Abra:

```text
http://localhost:3000
```

Faça login com o usuário criado no Firebase.

Teste este fluxo:

1. Novo ensaio.
2. Selecione Padrão A.
3. Confira as peneiras exibidas.
4. Troque para Padrão B.
5. Confira que as peneiras mudaram.
6. Lance A1/A2.
7. Confira cálculos e gráfico.
8. Salve.
9. Abra o relatório.
10. Confira a pré-validação.
11. Baixe o PDF.
12. Quando estiver tudo certo, clique **Emitir e salvar na nuvem**.
13. Confirme no Firebase Storage que o PDF foi salvo.

---

# 7. Publicar no Vercel

1. Acesse a Vercel.
2. **Add New → Project**.
3. Importe o repositório `solocontrol-lab` do GitHub.
4. Framework: o Vercel deve reconhecer **Next.js** automaticamente.
5. Em **Environment Variables**, crie todas as variáveis do `.env.local`.
6. Clique em **Deploy**.

Depois do deploy, copie o domínio, por exemplo:

```text
https://solocontrol-lab.vercel.app
```

## Autorizar o domínio no Firebase

Firebase → Authentication → Settings → Authorized domains.

Adicione o domínio da Vercel se ele ainda não estiver listado.

---

# 8. Rotina operacional sugerida

### Técnico
`Login → Novo ensaio → cabeçalho → faixa → pesagens A1/A2 → análise automática → salvar para revisão`

### Coordenação
`Abrir relatório → conferir dados/cálculos → visualizar A4 → emitir PDF oficial`

### Cliente
Recebe apenas o **PDF oficial padronizado**.

---

# 9. Próximos módulos recomendados

A arquitetura foi preparada para adicionar, na sequência:

1. Material pulverulento — NBR 16973.
2. Índice de forma — Anexo A da NBR 5564.
3. Torrões de argila — NBR 7218.
4. Los Angeles.
5. Massa específica, porosidade e absorção.
6. Intempérie.
7. Massa unitária.
8. Painel de gestão e indicadores por cliente/obra/material.
9. Numeração automática e revisão controlada dos relatórios.
10. Assinatura técnica digitalizada e configuração de responsável técnico.

O princípio é manter **um único motor de relatórios**, com cabeçalho e rodapé padronizados, independentemente do ensaio.

## V6 — robustez do build na Vercel
A configuração Web do Firebase possui fallback no `src/lib/firebase.ts`. As variáveis
`NEXT_PUBLIC_*` da Vercel continuam tendo prioridade, mas a ausência delas não derruba
mais o build com `auth/invalid-api-key`.
