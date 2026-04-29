"use client";

import { useState } from "react";
import { featureApi } from "@/lib/api";
import { Car, Briefcase, Users, Info } from "lucide-react";
import toast from "react-hot-toast";
import { getApiError } from "@/lib/api";

type CalcTab = "motor" | "gratuity" | "alimony";

function inr(v: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

function ResultRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-2.5 border-b border-border last:border-0 ${bold ? "font-semibold" : ""}`}>
      <span className={`text-sm ${bold ? "" : "text-muted-fg"}`}>{label}</span>
      <span className={`text-sm ${bold ? "text-primary text-base" : ""}`}>{value}</span>
    </div>
  );
}

export default function CompensationPage() {
  const [tab, setTab] = useState<CalcTab>("motor");

  // Motor accident
  const [age, setAge] = useState(35);
  const [income, setIncome] = useState(40000);
  const [dependents, setDependents] = useState(2);
  const [futureProspects, setFutureProspects] = useState(25);
  const [injuryType, setInjuryType] = useState("death");
  const [motorResult, setMotorResult] = useState<any>(null);
  const [motorLoading, setMotorLoading] = useState(false);

  // Gratuity
  const [yearsOfService, setYearsOfService] = useState(10);
  const [lastSalary, setLastSalary] = useState(50000);
  const [gratuityResult, setGratuityResult] = useState<any>(null);
  const [gratuityLoading, setGratuityLoading] = useState(false);

  // Alimony
  const [monthlyIncome, setMonthlyIncome] = useState(80000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(40000);
  const [alimonyResult, setAlimonyResult] = useState<any>(null);
  const [alimonyLoading, setAlimonyLoading] = useState(false);

  async function handleMotor(e: React.FormEvent) {
    e.preventDefault();
    setMotorLoading(true);
    try {
      const { data } = await featureApi.motorAccidentComp({ age, monthly_income: income, dependents, future_prospects_percent: futureProspects, injury_type: injuryType });
      setMotorResult(data);
    } catch (err: any) { toast.error(getApiError(err, "Calculation failed")); }
    finally { setMotorLoading(false); }
  }

  async function handleGratuity(e: React.FormEvent) {
    e.preventDefault();
    setGratuityLoading(true);
    try {
      const { data } = await featureApi.gratuity({ years_of_service: yearsOfService, last_drawn_salary: lastSalary });
      setGratuityResult(data);
    } catch (err: any) { toast.error(getApiError(err, "Calculation failed")); }
    finally { setGratuityLoading(false); }
  }

  async function handleAlimony(e: React.FormEvent) {
    e.preventDefault();
    setAlimonyLoading(true);
    try {
      const { data } = await featureApi.alimony({ monthly_income: monthlyIncome, monthly_expenses: monthlyExpenses });
      setAlimonyResult(data);
    } catch (err: any) { toast.error(getApiError(err, "Calculation failed")); }
    finally { setAlimonyLoading(false); }
  }

  const TABS = [
    { id: "motor" as CalcTab, label: "Motor Accident", Icon: Car },
    { id: "gratuity" as CalcTab, label: "Gratuity", Icon: Briefcase },
    { id: "alimony" as CalcTab, label: "Interim Alimony", Icon: Users },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Compensation Calculators</h1>
        <p className="text-sm text-muted-fg mt-1">
          Deterministic estimates using Supreme Court guidance (Sarla Verma, Pranay Sethi, Payment of Gratuity Act).
        </p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${tab === id ? "border-primary text-primary" : "border-transparent text-muted-fg hover:text-foreground"}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "motor" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 p-3 flex gap-2 text-xs text-blue-800 dark:text-blue-300">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            Uses structured formula per Sarla Verma v. DTC (2009) and National Insurance v. Pranay Sethi (2017). Multiplier based on age.
          </div>
          <form onSubmit={handleMotor} className="grid gap-4 md:grid-cols-2">
            {[
              { label: "Deceased/Injured Age", value: age, set: setAge, type: "number", min: 14 },
              { label: "Monthly Income (₹)", value: income, set: setIncome, type: "number", min: 0 },
              { label: "Number of Dependants", value: dependents, set: setDependents, type: "number", min: 0 },
              { label: "Future Prospects Increment (%)", value: futureProspects, set: setFutureProspects, type: "number", min: 0, max: 100 },
            ].map(({ label, value, set, ...rest }) => (
              <div key={label} className="space-y-1">
                <label className="text-sm font-medium">{label}</label>
                <input {...rest} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" value={value} onChange={(e) => (set as any)(Number(e.target.value))} />
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-sm font-medium">Injury Type</label>
              <select className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" value={injuryType} onChange={(e) => setInjuryType(e.target.value)}>
                <option value="death">Death</option>
                <option value="grievous injury">Grievous Injury</option>
                <option value="simple injury">Simple Injury</option>
              </select>
            </div>
            <button type="submit" disabled={motorLoading} className="md:col-span-2 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover disabled:opacity-50 transition">
              {motorLoading ? "Calculating..." : "Calculate Compensation"}
            </button>
          </form>
          {motorResult && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="text-xs font-semibold text-muted-fg uppercase tracking-wide mb-3">Compensation Breakdown</div>
              <ResultRow label="Multiplier (age-based)" value={`× ${motorResult.multiplier}`} />
              <ResultRow label="Loss of Dependency" value={inr(motorResult.loss_of_dependency)} />
              <ResultRow label="Conventional Heads (Pranay Sethi)" value={inr(motorResult.conventional_heads)} />
              <ResultRow label="Total Compensation" value={inr(motorResult.total_compensation)} bold />
              <p className="text-xs text-muted-fg mt-3">{motorResult.reference}</p>
              <p className="text-xs text-muted-fg">{motorResult.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab === "gratuity" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 p-3 flex gap-2 text-xs text-blue-800 dark:text-blue-300">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            Formula: (15 ÷ 26) × last drawn monthly salary × years of service. Maximum: ₹20,00,000. Payable after 5+ years of continuous service.
          </div>
          <form onSubmit={handleGratuity} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Years of Continuous Service</label>
              <input type="number" min={0} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" value={yearsOfService} onChange={(e) => setYearsOfService(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Last Drawn Monthly Salary (₹)</label>
              <input type="number" min={0} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" value={lastSalary} onChange={(e) => setLastSalary(Number(e.target.value))} />
            </div>
            <button type="submit" disabled={gratuityLoading} className="md:col-span-2 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover disabled:opacity-50 transition">
              {gratuityLoading ? "Calculating..." : "Calculate Gratuity"}
            </button>
          </form>
          {gratuityResult && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <ResultRow label="Years of Service" value={`${gratuityResult.years_of_service} years`} />
              <ResultRow label="Last Drawn Monthly Salary" value={inr(gratuityResult.last_drawn_salary)} />
              <ResultRow label="Gratuity Amount" value={inr(gratuityResult.gratuity_amount)} bold />
              <p className="text-xs text-muted-fg mt-3">{gratuityResult.reference}</p>
            </div>
          )}
        </div>
      )}

      {tab === "alimony" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 p-3 flex gap-2 text-xs text-blue-800 dark:text-blue-300">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            Interim maintenance estimate: ~35% of disposable income (income minus expenses). Governed by Section 24 HMA and Section 144 BNSS. Actual amount depends on lifestyle, children, and court discretion.
          </div>
          <form onSubmit={handleAlimony} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Respondent Monthly Income (₹)</label>
              <input type="number" min={0} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" value={monthlyIncome} onChange={(e) => setMonthlyIncome(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Respondent Monthly Expenses (₹)</label>
              <input type="number" min={0} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(Number(e.target.value))} />
            </div>
            <button type="submit" disabled={alimonyLoading} className="md:col-span-2 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover disabled:opacity-50 transition">
              {alimonyLoading ? "Calculating..." : "Estimate Support Amount"}
            </button>
          </form>
          {alimonyResult && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <ResultRow label="Monthly Income" value={inr(alimonyResult.monthly_income)} />
              <ResultRow label="Monthly Expenses" value={inr(alimonyResult.monthly_expenses)} />
              <ResultRow label="Disposable Income" value={inr(alimonyResult.monthly_income - alimonyResult.monthly_expenses)} />
              <ResultRow label="Estimated Monthly Support (35%)" value={inr(alimonyResult.estimated_monthly_support)} bold />
              <p className="text-xs text-muted-fg mt-3">{alimonyResult.reference}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
