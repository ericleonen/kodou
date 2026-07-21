/** Route params for each navigator. */

export type TabParamList = {
  program: undefined;
  run: undefined;
  you: undefined;
};

export type ProgramStackParamList = {
  ProgramHome: undefined;
  PresetDetail: { presetId: string };
};

export type YouStackParamList = {
  YouHome: undefined;
  RunDetail: { runId: string };
  RunEdit: { runId: string };
  Settings: undefined;
};
