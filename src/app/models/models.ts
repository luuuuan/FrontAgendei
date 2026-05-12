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
}

export interface Servico {
  id?: number;
  nome: string;
  descricao: string;
  duracaoMinutos: number;
  tempoBuffer?: number;
  valor: number;
  profissionalId: number;
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

export interface EnderecoAgendamento {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
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
  profissionalId: number;
  servicos: number[];
  enderecoId?: number;
}

export interface AgendamentoResponse {
  id?: number;
  dataAgendamento: string;
  dataCriacao?: string;
  horaInicio?: string;
  horaFim?: string;
  statusAgendamento: string;
  valorTotal?: number;
  observacoes?: string;
  usuarioId: number;
  profissionalId: number;
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
  statusHorario: string;
  profissionalId?: number;
  profissional?: { id: number; nome?: string };
  servicoId?: number;
  servico?: { id: number; nome?: string };
}
