// this is the SimObject used to serialize the output

// C# DTO
/*
        public string Type { get; set; }

        public string Id { get; set; }

        public DateTime Date { get; set; }

        public string Name { get; set; }
        public string Description { get; set; }  // immutable, is used to generate Reports Detail
        public string MutableDescription { get; set; }  // unused during Reports generation, can be used for debug purpose (and in the future to be shown to the user during a Drill Down of reports voices)

        public List<string> Metadata__Name { get; set; }
        public List<string> Metadata__Value { get; set; }
        public List<decimal> Metadata__PercentageWeight { get; set; }

        public string UnitId { get; set; }

        // the values are always positive, also debts and costs, then this is the sign/side (debit/credit, left/right) and the type (BS/IS) of the voice
        public string DoubleEntrySide { get; set; }  // enum DoubleEntrySidesEnum.cs (ProjX.Accounting.Classifier.v1.DoubleEntrySidesEnum)

        public string Currency { get; set; }  // enum CurrencyEnum.cs (ProjX.Accounting.Classifier.v1.CurrencyEnum)

        public string IntercompanyInfo__VsUnitId { get; set; }

        public decimal Value { get; set; }
        public decimal WritingValue { get; set; }

        //public ? Version { get; set; }  // USED ONLY IN JS implementation, to check versioning of the SimObject
        //public ? OldVersion { get; set; }  // USED ONLY IN JS implementation, to check versioning of the SimObject

        public bool Alive { get; set; }

        #region command, command group properties
        public string Command__Id { get; set; }
        public string Command__DebugDescription { get; set; }

        public string CommandGroup__Id { get; set; }
        public string CommandGroup__DebugDescription { get; set; }
        #endregion command, command group properties

        #region properties common only to some kind of SimObjects
        public decimal BS_Principal__PrincipalToPay_IndefiniteExpiryDate { get; set; }
        public List<DateTime> BS_Principal__PrincipalToPay_AmortizationSchedule__Date { get; set; }
        public List<decimal> BS_Principal__PrincipalToPay_AmortizationSchedule__Principal { get; set; }

        public string IS_Link__SimObjId { get; set; }
 */