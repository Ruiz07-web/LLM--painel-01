export type ChartType = 'line' | 'bar' | 'table';

export interface Serie {
  key: string;
  name: string;
  color?: string;
}

export interface AxisSpec {
  key: string;
  label: string;
}

export interface Coluna {
  key: string;
  label: string;
}

export type Linha = Record<string, string | number | null>;

export interface Visualization {
  type: ChartType;
  title: string;
  subtitle?: string;
  data: Linha[];
  xAxis?: AxisSpec;
  yAxis?: AxisSpec;
  series?: Serie[];
  columns?: Coluna[];
  source?: string;
}

export type MessageState = 'loading' | 'error' | 'done';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  state: MessageState;
  visualization?: Visualization;
}

export interface Conversa {
  id: string;
  title: string;
}
