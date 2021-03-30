// UNUSED, ONLY FOR HISTORYCAL PURPOSE
/*
using System;
using System.Data;
using System.Collections.Generic;
using ProjX.SimulationLedger.v1;

namespace ProjX.FM.Scripting.Infrastructure.v1
{
    public interface IModule
    {
        // Settings executed only one time before the simulation starts
        void OneTimeBeforeTheSimulationStarts(IEnumerable<(DataTable Table, bool Volatile)> tables, IFmLedger simulationLedger);

        // Settings executed only one time after the simulation ends
        void OneTimeAfterTheSimulationEnds(IFmLedger simulationLedger);

        // Code executed daily, before modeling starts
        void BeforeDailyModeling(DateTime currentDay, IFmLedger simulationLedger);

        // Daily modeling
        void DailyModeling(DateTime currentDay, IFmLedger simulationLedger);

        // Code executed daily, after modeling ends
        void AfterDailyModeling(DateTime currentDay, IFmLedger simulationLedger);
    }
}
*/
