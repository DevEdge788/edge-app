# EDGE App

Criar uma aplicação web responsiva e profissional para gestão integrada de clínicas de saúde e bem-estar da Clínica EDGE+, com identidade visual baseada nos materiais fornecidos: azul-marinho, verde/teal, branco, estética clínica premium, limpa e humana; usar logótipo EDGE+ e elementos visuais de saúde oral/bem-estar. A app deve ser em português de Portugal.

Contexto de dados existente: base de dados intelio1_EDGE, descrita no Dicionário de Dados da Clínica EDGE+. Existem 8 tabelas principais: agenda para marcações/consultas; medico para profissionais; users para autenticação, perfis e acessos; paciente para ficha clínica/dados demográficos/fiscais; procedimentos para atos clínicos por consulta; especialidade e especialidade_n para configuração de especialidades e cores/ícones UI; utilizador como backoffice legado. Respeitar e evoluir esta estrutura, mas melhorar com novas tabelas quando necessário: roles, permissions, appointment_confirmations, waiting_queue, clinical_records, anamnesis_templates, anamnesis_answers, payments, invoices, commissions, audit_logs, notifications, crm_leads, crm_interactions, media_assets, rooms/gabinetes, services/catalog.

Objetivo: construir um SaaS/ERP clínico com módulos para pacientes, profissionais, staff/receção e administração, cobrindo agendamento, ficha clínica, procedimentos, fila de espera, caixa, comissões, relatórios, CRM e fichas de anamnese por especialidade.

Perfis e acessos:
1. Admin: acesso total a todas as áreas, configuração de utilizadores, especialidades, tratamentos, valores, permissões, relatórios financeiros, caixa, comissões, CRM e auditoria.
2. Staff/receção: acesso às agendas de todos os colaboradores; pode criar, alterar, consultar, apagar, mover e mudar qualquer característica do agendamento de qualquer cliente/paciente; acesso à fila de espera, receção, pagamentos, faturas e próxima consulta.
3. Médico/Dentista/Nutricionista/Terapeuta/Esteticista/Podologista/Massagista e outros profissionais: acesso apenas à sua agenda e aos dados clínicos relevantes da sua especialidade. Deve ver nome do paciente, tipo de tratamento, horário e gabinete. Durante a consulta pode abrir ficha clínica limitada: não pode ver telefone, telemóvel, email, morada ou outros contactos pessoais; pode ver apenas dados de saúde, histórico clínico e procedimentos da sua área/especialidade. Deve conseguir registar atos/procedimentos, notas e evolução clínica.
4. Cliente/Paciente: portal para consultar a sua ficha, alterar dados pessoais, consultar, criar, alterar, confirmar, desmarcar/cancelar agendamentos, ver histórico permitido, consentimentos e comunicações.
5. Outros perfis configuráveis por admin via RBAC granular.

Autenticação e segurança:
- Login por email e palavra-passe, com passwords encriptadas.
- RBAC com permissões por módulo e ação.
- Separação clara de dados administrativos, pessoais e clínicos.
- Auditoria de ações sensíveis: quem criou/alterou/apagou agendamento, ficha, pagamento, fatura, procedimento, anamnese, etc.
- Preparar conformidade RGPD: consentimentos, registo de acesso, minimização de dados por perfil, exportação/retificação de dados do paciente.

Módulo de agendamento:
- Calendário por profissional, especialidade, gabinete, dia/semana/mês.
- Cores por especialidade e tipo de agendamento, usando especialidade_n.cor_ui e cor associada.
- Quando o paciente fizer agendamento online, criar registo na agenda do médico/profissional solicitado, com tipo “Agendamento Online” e cor própria.
- Estados: pedido, confirmado, cancelado/desmarcado, reagendado, em espera, chegou, em consulta, concluído, faltou/no-show.
- Staff pode editar todos os campos: profissional, paciente, horário, data, tipo, tratamento, gabinete, estado, observações, valor proposto, meio de pagamento, etc.
- Paciente pode criar, consultar, alterar dentro das regras, confirmar e desmarcar.
- Profissional vê a sua agenda com nome do paciente, tratamento, hora, gabinete e estado.

Lembretes e confirmações:
- Enviar lembrete ao paciente por SMS, WhatsApp e email no dia anterior ao agendamento às 09:00.
- Solicitar confirmação ao paciente nesses canais; a resposta deve ficar registada na base de dados com data/hora, canal, estado e utilizador/origem.
- Mostrar no calendário se confirmado pelo paciente, pendente ou recusado.
- Preparar integrações por abstração: email SMTP/Sendgrid, SMS gateway, WhatsApp Business API, com logs de envio e falhas.

Fila de espera visual:
- Painel/ecrã apelativo para receção/sala de espera mostrando quantos pacientes estão à espera por especialidade, hora de chegada de cada paciente, tempo previsto de espera e estado.
- Deve permitir modo TV/kiosk com branding EDGE+ e rotação de vídeos ou imagens publicitárias carregadas pelo admin/staff.
- Não mostrar dados sensíveis; usar primeiro nome ou código/senha se configurado.
- Staff marca chegada do paciente; sistema calcula espera estimada com base nos atrasos e duração das consultas anteriores.

Consulta clínica:
- O médico abre consulta a partir da agenda.
- Deve consultar dados de saúde, histórico de consultas da sua área/especialidade, anamneses e procedimentos relevantes.
- Para medicina dentária, criar interface odontograma/dente-a-dente simples e rápida: selecionar dente por notação FDI/ISO 3950, procedimento, observações, estado, valor proposto, valor final, duração e próxima consulta.
- Para outras especialidades, criar fichas clínicas por área: nutrição, estética, naturopatia, massagem, pedicure avançada/podologia, etc.
- Médico fecha a consulta e pode sugerir valor associado.

Receção, pagamentos e faturação:
- No final da consulta, receção vê lista de pacientes concluídos/por cobrar.
- Para cada paciente, receção consulta valores sugeridos pelo médico/profissional, regista valor efetivamente pago, fatura emitida ou necessidade de emissão de fatura, número da fatura, meio de pagamento, valor a atribuir à folha de comissões do profissional, data e duração da próxima consulta.
- Deve haver folha de caixa diária por data, com abertura/fecho de caixa, totais por meio de pagamento, valores cobrados, pendentes, descontos e reconciliação.

Comissões e relatórios:
- Admin vê área financeira com folha de caixa por cada data.
- Admin emite relatórios por período selecionável, por profissional, por especialidade, por meio de pagamento e por estado de faturação.
- Cada profissional, no fim do seu dia de consultas, recebe relatório com nome do paciente, valor sobre o qual será calculada a comissão, percentagem ou regra aplicada e valor da comissão.
- Configuração de regras de comissão por profissional, especialidade, produto/serviço ou procedimento.

CRM:
- Módulo CRM para gerir leads, origem/canal de captação, referidos, campanhas, pipeline, interações, chamadas, mensagens, emails, tarefas e conversão em paciente.
- Usar dados como proveniência do paciente, referral_code, referred_by e referral_count quando existirem.
- Dashboard de oportunidades, marcações pendentes, pacientes inativos, aniversários, follow-up pós-consulta e campanhas.

Anamneses por especialidade:
- Construtor visual de fichas de anamnese por especialidade.
- Tipos de campo: texto curto, texto longo, número, data, escolha única, escolha múltipla, sim/não, escala, assinatura/consentimento, upload de documento/imagem.
- Versionamento de templates; respostas associadas ao paciente, profissional, especialidade e data.
- Permissões para limitar visualização por especialidade.

Design/UI:
- Visual EDGE+: azul-marinho profundo, teal/verde água, branco, cinza muito claro, cantos arredondados, cartões limpos, ícones lineares, sensação premium e clínica.
- Layouts: dashboard admin, portal paciente, calendário, ecrã sala de espera, consulta clínica, odontograma, receção/caixa, relatórios, CRM, editor de anamnese.
- Incluir navegação lateral para backoffice e navegação simples para portal paciente.
- Criar dados de demonstração realistas em português.

Entidades principais a implementar/sugerir no modelo:
- users, roles, permissions, user_roles.
- patients/paciente com dados pessoais, fiscais, clínicos e consentimentos.
- professionals/medico com especialidade, utilizador, estado, comissão.
- specialties/especialidade_n com nome, descrição, cor_ui, ícone, ativo, ordem.
- appointments/agenda com paciente, profissional, data, hora início/fim, tipo, estado, gabinete, tratamento, observações, valores e origem online/staff.
- procedures/procedimentos com appointment, patient, professional, specialty, tooth_number, procedure_type, service, notes, proposed_value, final_value, duration, invoice, commission_value.
- appointment_confirmations, notification_logs, waiting_queue, payments, invoices, cash_sessions, commission_rules, commission_lines, anamnesis_templates, anamnesis_answers, crm_leads, crm_interactions, audit_logs, media_assets.

Prioridade de construção:
1. Estrutura de autenticação, roles e dashboards por perfil.
2. Calendário/agendamento multi-profissional com agendamento online de paciente e cores por tipo/especialidade.
3. Portal do paciente com ficha e marcações.
4. Agenda profissional e consulta clínica com registo de procedimentos e odontograma básico.
5. Receção: fila de espera, lista por cobrar, pagamentos/fatura/próxima consulta.
6. Admin: caixa diária, relatórios, comissões.
7. Lembretes/confirmações com logs e mock providers.
8. CRM e construtor de anamnese.

Criar uma primeira versão funcional com backend, base de dados, autenticação, UI e dados demo, deixando integrações externas de SMS/WhatsApp/email em modo simulado com camada de providers substituível.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dfc7f6f2-d2a4-4446-a47a-e7c8bc70a772).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
