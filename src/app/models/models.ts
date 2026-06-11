// usuario.model.ts
export interface Usuario {
  id?: number;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  dataNascimento?: string;
  enderecoId?: number;
  tipoUsuario?: string;
  ativo?: boolean;
}

export interface UsuarioLogin {
  email?: string;
  cpfCnpj?: string;
  senha: string;
}

export interface UsuarioLoginResponse {
  usuarioId: number;
  email: string;
  tipoUsuario: string;
  prestadorId?: number;
  nomeEmpresa?: string;
  nomeFantasia?: string;
  token?: string; // JWT retornado pelo back após login
}

export interface Servico {
  id?: number;
  nome: string;
  descricao: string;
  duracaoMinutos: number;
  tempoBuffer?: number;
  valor: number;
  valorServico?: number;
  valorUnitario?: number;
  tipoCobranca?: string;
  localAtendimento?: string;
  profissionalId?: number;
  profissionalNome?: string;
  nomeProfissional?: string;
  prestadorId?: number;
  prestadorNome?: string;
  nomePrestador?: string;
  statusServico?: string;
  statusExecucaoServico?: string;
}

export interface Profissional {
  id?: number;
  nome: string;
  descricao?: string;
  comissaoPercentual?: number;
  statusProfissional?: string;
  prestadorId?: number;
  servicosIds?: number[];
  usuario?: Usuario;
  servico?: Servico[];
  atendeADomicilio?: boolean;
}

export interface Agendamento {
  id?: number;
  dataAgendamento: string;
  dataCriacao?: string;
  horaInicio?: string;
  horaFim?: string;
  dataConfirmacao?: string;
  statusAgendamento?: string;
  taxaPlataforma?: number;
  valorTotal?: number;
  observacoes?: string;
  usuarioId: number;
  profissionalId?: number;  
  prestadorNome?: string;
  nomePrestador?: string;
  servicos: number[];
  enderecoId?: number;
}


export interface AgendamentoResponse {
  id?: number;
  motivoCancelamento?: string;
  dataAgendamento: string;
  dataCriacao?: string;
  horaInicio?: string;
  horaFim?: string;
  statusAgendamento: string;
  valorTotal?: number;
  observacoes?: string;
  usuarioId: number;
  profissionalId?: number;
  prestadorNome?: string;
  nomePrestador?: string;
  servicoId: number[];
}

export interface Prestador {
  id?: number;
  nomeEmpresa?: string;
  cnpj?: string;
  usuarioId?: number;
}

export interface HorarioDisponivel {
  id?: number;
  data: string;
  horaInicio: string;
  horaFim: string;
  status: boolean;
  profissionalId?: number;
  profissional?: { id: number; nome?: string };
  servicoId?: number;
  servico?: { id: number; nome?: string };
}

export interface EnderecoAgendamento {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}