// ipotesi di interfaccia TS

// vedi docs, >standard_module_methods_id

export interface IModule {
    oneTimeBeforeTheSimulationStarts(listOfTables: any[], setContext: Divers_and_Variables_Repository__set, getContext: Divers_and_Variables_Repository__get): void;

    oneTimeAfterTheSimulationEnds(getContext: Divers_and_Variables_Repository__get): void;

    beforeDailyModeling(getContext: Divers_and_Variables_Repository__get): void; // Code executed daily, before modeling starts

    dailyModeling(getContext: Divers_and_Variables_Repository__get): void; // Daily modeling

    afterDailyModeling(getContext: Divers_and_Variables_Repository__get): void;  // Code executed daily, after modeling ends
}

export interface Divers_and_Variables_Repository__set {
    (namespace: string, name: string, value: any): boolean;
};

export interface Divers_and_Variables_Repository__get {
    (namespace: string, name: string): any;
};
