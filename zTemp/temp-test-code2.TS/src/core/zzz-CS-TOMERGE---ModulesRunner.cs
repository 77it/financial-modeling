using CSharpFunctionalExtensions;
using ProjX.FM.Scripting.Js.v1;
using ProjX.FM.Scripting.Utilities.v1;
using System;
using DateUtils = Utilities.DateUtils;

namespace ProjX.FM.Scripting.Infrastructure.v1
{
    public class ModulesRunner
    {
        private ModulesRunnerJsSettings JsSettings { get; }
        private JsScriptRunner JsScriptRunner { get; }
        private ScriptingContext ScriptingContext { get; }
        private FmVariables FmVariables { get; }
        public DateTime FirstDayOfSimulation { get; }
        public DateTime LastDayOfSimulation { get; }
        public DateTime Today { get; private set; }
        public bool SimulationStarted { get; private set; }
        public bool SimulationEnded { get; private set; }

        public ModulesRunner(UserInputTables tables, ModulesRunnerJsSettings jsSettings, DateTime firstDayOfSimulation, DateTime lastDayOfSimulation)
        {
            if (jsSettings is null) throw new ArgumentNullException(nameof(jsSettings));
            if (tables is null) throw new ArgumentNullException(nameof(tables));

            FirstDayOfSimulation = DateUtils.ConvertDateToUtc(firstDayOfSimulation);
            Today = FirstDayOfSimulation;
            LastDayOfSimulation = DateUtils.ConvertDateToUtc(lastDayOfSimulation);
            SimulationStarted = false;
            SimulationEnded = false;

            JsSettings = jsSettings;

            FmVariables = new FmVariables(firstDayOfSimulation);

            ScriptingContext = ScriptingContext.ScriptingContextWithRealFs("PATH");

            JsScriptRunner = JsScriptRunner.RunnerWithContext(jsSettings.JsScriptRunnerType, ScriptingContext, "context");

            // execute Js optional infrastructure functions from a folder
            if (JsSettings.InfrastructureFunctionsPath.HasValue)
                JsScriptRunner.RunScriptFilesFromAFolder(JsSettings.InfrastructureFunctionsPath.Value);

            // run all Js scripts files from a folder or from a list
            if (JsSettings.ScriptsPath.HasValue)
                JsScriptRunner.RunScriptFilesFromAFolder(JsSettings.ScriptsPath.Value);
            else
                JsScriptRunner.RunScriptsTexts(JsSettings.ScriptsTexts.Value);

            // mette in ordine di esecuzione i moduli leggendo Ord dal dizionario dei moduli valorizzato dal Javascript chiamato prima
            // OrdinalIgnoreCase: Compare strings using ordinal (binary) sort rules and ignoring the case of the strings being compared:
            // https://docs.microsoft.com/it-it/dotnet/api/system.stringcomparer.ordinalignorecase 
            // https://docs.microsoft.com/en-us/dotnet/api/system.stringcomparison?view=netcore-3.0#System_StringComparison_OrdinalIgnoreCase 

            // don't call any modules. will be called by RunNextDay()
            throw new NotImplementedException();
        }

        public Result RunNextDay()
        {
            if (SimulationEnded) return Result.Fail("simulation ended");
            if (!SimulationStarted)  // if is the first day of the Simulation
            {
                SimulationStarted = true;
                FmVariablesAdminWriter.SetToday(FmVariables, Today);
                //JsScriptingContextAdminWriter.SetToday(ScriptingContext, Today);

                // lauch Start Simulation command in Ledger
                // XXX

                // esegue i moduli secondo l'ordine stabilito su Init, settando su JsScriptingContext il nome del modulo corrente

                // legge dal dizionario dei moduli registrati il tipo (script = Js, se diverso "ERRORE" visto che non sono implementate altre sorgenti)

                // se definiti i moduli, chiama tutti i moduli che hanno definito [OneTimeBeforeSimulation] diversamente skippa la chiamata
                {
                    // extract the current ModuleId from tables
                    ModuleSortableUuid currentModuleId = null;
                    // set current ModuleId
                    //JsScriptingContextAdminWriter.SetModuleId(ScriptingContext, currentModuleId);

                    // esegue il modulo Js con JsScriptRunner.JsRun(), intercettando con Try/Catch eventuali errori (es modulo Js non esistente)
                }
            }
            else  // if is NOT the first day of the Simulation
            {
                Today = Today.AddDays(1);
                FmVariablesAdminWriter.SetToday(FmVariables, Today);
                //JsScriptingContextAdminWriter.SetToday(ScriptingContext, Today);
            }

            // esegue i moduli secondo l'ordine stabilito su Init, settando su JsScriptingContext il nome del modulo corrente
            // legge dal dizionario dei moduli registrati il tipo (script = Js, se diverso "ERRORE" visto che non sono implementate altre sorgenti)
            // se definiti i moduli, chiama [BeforeDay], [Day], [AfterDay], diversamente skippa la chiamata
            // esegue il modulo Js con Run(), intercettando con Try/Catch eventuali errori (es modulo Js non esistente)

            if (Today == LastDayOfSimulation)
            {
                SimulationStarted = false;
                SimulationEnded = true;

                // lauch EOD command in Ledger
                // XXX

                // esegue i moduli secondo l'ordine stabilito su Init, settando su JsScriptingContext il nome del modulo corrente
                // legge dal dizionario dei moduli registrati il tipo (script = Js, se diverso "ERRORE" visto che non sono implementate altre sorgenti)
                // se definiti i moduli, chiama [OneTimeAfterSimulation] diversamente skippa la chiamata
                // esegue il modulo Js con Run(), intercettando con Try/Catch eventuali errori (es modulo Js non esistente)

                // Ends the simulation
                // XXX
            }

            throw new NotImplementedException();

            return Result.Ok();
        }
    }
}
