export interface IModule {
    oneTimeBeforeTheSimulationStarts(listOfTables: any[], setContext: Divers_and_Variables_Repository__set, getContext: Divers_and_Variables_Repository__get): void;
    oneTimeAfterTheSimulationEnds(getContext: Divers_and_Variables_Repository__get): void;
    beforeDailyModeling(getContext: Divers_and_Variables_Repository__get): void;
    dailyModeling(getContext: Divers_and_Variables_Repository__get): void;
    afterDailyModeling(getContext: Divers_and_Variables_Repository__get): void;
}
export interface Divers_and_Variables_Repository__set {
    (namespace: string, name: string, value: any): boolean;
}
export interface Divers_and_Variables_Repository__get {
    (namespace: string, name: string): any;
}
