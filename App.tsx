
import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  ArrowRightLeft, 
  DollarSign, 
  Package, 
  CheckCircle2,
  Percent,
  TrendingUp,
  ShoppingBag,
  Store,
  Info,
  ShieldCheck
} from 'lucide-react';
import { ImportInputs, CalculationResult, MarketplaceMargin, Scenario } from './types';

// O Imposto de Importação é fixo em 60% conforme solicitado
const IMPORT_TAX_RATE = 0.60;

const App: React.FC = () => {
  // 1. ESTADO INICIAL
  const [inputs, setInputs] = useState<ImportInputs>({
    quantity: 100,
    unitPriceUsd: 10.0,
    freightUsd: 50.0,
    exchangeRate: 5.40,
    icmsRate: 19, // Padrão SP conforme seu exemplo
    sellingPriceShopee: 150.0,
    sellingPriceML: 160.0
  });

  const [activeScenario, setActiveScenario] = useState<Scenario>(Scenario.FULL);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  // 2. LÓGICA DE CÁLCULO
  const calculateImport = (declarationPercent: number): CalculationResult => {
    const declaredProductPrice = inputs.unitPriceUsd * declarationPercent;
    const declaredProductTotalBRL = (inputs.quantity * declaredProductPrice) * inputs.exchangeRate;
    const freightTotalBRL = inputs.freightUsd * inputs.exchangeRate;
    
    // Valor Aduaneiro = Produto Declarado + Frete
    const customsValueBRL = declaredProductTotalBRL + freightTotalBRL;
    
    // Imposto de Importação (II) - Fixo 60%
    const importTaxBRL = customsValueBRL * IMPORT_TAX_RATE;
    
    // ICMS com cálculo "por dentro" (Base = (Custo + II) / (1 - ICMS))
    const icmsDecimal = inputs.icmsRate / 100;
    const icmsBRL = (customsValueBRL + importTaxBRL) * (icmsDecimal / (1 - icmsDecimal));
    
    const totalTaxesBRL = importTaxBRL + icmsBRL;
    
    // Custo Total Real = Preço Real Pago (100%) + Frete + Impostos (baseados no cenário de declaração)
    const realProductTotalBRL = (inputs.quantity * inputs.unitPriceUsd) * inputs.exchangeRate;
    const totalImportCostBRL = realProductTotalBRL + freightTotalBRL + totalTaxesBRL;
    const unitCostBRL = totalImportCostBRL / inputs.quantity;

    return {
      declaredProductTotalBRL,
      productTotalBRL: realProductTotalBRL,
      freightTotalBRL,
      customsValueBRL,
      importTaxBRL,
      icmsBRL,
      totalTaxesBRL,
      totalImportCostBRL,
      unitCostBRL
    };
  };

  const cost100 = useMemo(() => calculateImport(1.0), [inputs]);
  const cost30 = useMemo(() => calculateImport(0.3), [inputs]);

  // Define qual custo será usado para o cálculo de margem nos marketplaces
  const currentCost = activeScenario === Scenario.FULL ? cost100 : cost30;

  const calculateMargin = (price: number, cost: number, fee: number, fixed: number): MarketplaceMargin => {
    const totalFee = (price * fee) + (price < 79 ? fixed : 0);
    const profit = price - totalFee - cost;
    const marginPercent = (profit / price) * 100;
    return {
      sellingPrice: price,
      feePercent: fee,
      fixedFee: fixed,
      profit,
      marginPercent
    };
  };

  const marginShopee = calculateMargin(inputs.sellingPriceShopee, currentCost.unitCostBRL, 0.20, 3.0);
  const marginML = calculateMargin(inputs.sellingPriceML, currentCost.unitCostBRL, 0.17, 6.0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans pt-8 pb-12">
      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA ESQUERDA - INPUTS */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <Calculator className="text-blue-600" />
              <h2 className="text-lg font-bold">Configuração da Importação</h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block tracking-wider">Quantidade Total</label>
                <input 
                  type="number" name="quantity" value={inputs.quantity} onChange={handleInputChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block tracking-wider">Preço Unit. (USD)</label>
                  <input 
                    type="number" name="unitPriceUsd" value={inputs.unitPriceUsd} onChange={handleInputChange}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block tracking-wider">Frete Total (USD)</label>
                  <input 
                    type="number" name="freightUsd" value={inputs.freightUsd} onChange={handleInputChange}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block tracking-wider">Cotação Dólar</label>
                  <input 
                    type="number" name="exchangeRate" value={inputs.exchangeRate} onChange={handleInputChange} step="0.01"
                    className="w-full p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block tracking-wider">ICMS do Estado (%)</label>
                  <input 
                    type="number" name="icmsRate" value={inputs.icmsRate} onChange={handleInputChange}
                    className="w-full p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest text-center">Preços de Venda (R$)</h3>
                <div className="space-y-4">
                  <div className="bg-sky-50 p-4 rounded-xl border border-sky-100">
                    <label className="text-[10px] font-black uppercase text-sky-600 mb-1 block">Venda na Shopee</label>
                    <input 
                      type="number" name="sellingPriceShopee" value={inputs.sellingPriceShopee} onChange={handleInputChange}
                      className="w-full bg-transparent border-none text-xl font-black text-sky-700 outline-none"
                    />
                  </div>
                  <div className="bg-sky-50 p-4 rounded-xl border border-sky-100">
                    <label className="text-[10px] font-black uppercase text-sky-600 mb-1 block">Venda no Mercado Livre</label>
                    <input 
                      type="number" name="sellingPriceML" value={inputs.sellingPriceML} onChange={handleInputChange}
                      className="w-full bg-transparent border-none text-xl font-black text-sky-700 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LEMBRETES */}
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm space-y-4">
            <h3 className="flex items-center gap-2 font-black text-blue-700 text-xs uppercase tracking-wider">
              <Info className="w-4 h-4" /> Lembretes e Metodologia
            </h3>
            <div className="space-y-3">
              <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                <p className="text-[11px] font-bold text-blue-900 uppercase mb-1">Cálculo de Impostos</p>
                <p className="text-[10px] text-blue-700 leading-tight">Base de 60% (II) sobre valor aduaneiro. ICMS calculado com "cálculo por dentro" conforme normas brasileiras.</p>
              </div>
              <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                <p className="text-[11px] font-bold text-blue-900 uppercase mb-1">Conformidade</p>
                <p className="text-[10px] text-blue-700 leading-tight">O uso da invoice de 30% visa simular competitividade, mas a declaração de 100% é a prática legal recomendada.</p>
              </div>
              <div className="text-[9px] text-blue-400 font-bold uppercase tracking-widest text-center pt-2">
                ImportMaster v2.3
              </div>
            </div>
          </div>
        </aside>

        {/* COLUNA DIREITA - RESULTADOS */}
        <section className="lg:col-span-8 flex flex-col gap-8">
          
          {/* SELETOR DE CENÁRIO (CENTRAL) - AZUL */}
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex">
            <button 
              onClick={() => setActiveScenario(Scenario.FULL)}
              className={`flex-1 py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all ${activeScenario === Scenario.FULL ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <CheckCircle2 className={`w-5 h-5 ${activeScenario === Scenario.FULL ? 'text-white' : 'text-slate-300'}`} />
              <div className="text-left">
                <p className="text-xs font-bold uppercase opacity-80">Declaração Completa</p>
                <p className="text-lg font-black">Invoice 100%</p>
              </div>
            </button>
            <button 
              onClick={() => setActiveScenario(Scenario.REDUCED)}
              className={`flex-1 py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all ${activeScenario === Scenario.REDUCED ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <CheckCircle2 className={`w-5 h-5 ${activeScenario === Scenario.REDUCED ? 'text-white' : 'text-slate-300'}`} />
              <div className="text-left">
                <p className="text-xs font-bold uppercase opacity-80">Declaração Reduzida</p>
                <p className="text-lg font-black">Invoice 30%</p>
              </div>
            </button>
          </div>

          {/* CARDS DE CUSTO UNITÁRIO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-8 rounded-3xl border-2 transition-all duration-500 ${activeScenario === Scenario.FULL ? 'bg-white border-blue-600 shadow-xl' : 'bg-slate-100 border-transparent opacity-50'}`}>
              <p className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Preço de Custo (Invoice 100%)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">R$ {cost100.unitCostBRL.toFixed(2)}</span>
              </div>
            </div>

            <div className={`p-8 rounded-3xl border-2 transition-all duration-500 ${activeScenario === Scenario.REDUCED ? 'bg-white border-emerald-500 shadow-xl' : 'bg-slate-100 border-transparent opacity-50'}`}>
              <p className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Preço de Custo (Invoice 30%)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-emerald-600">R$ {cost30.unitCostBRL.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* TABELA DE TRIBUTOS E VALORES */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="bg-slate-50 p-5 border-b flex justify-between items-center">
                <h3 className="font-black text-slate-700 flex items-center gap-2 uppercase text-sm tracking-tighter">
                  <ArrowRightLeft className="w-4 h-4 text-blue-500" /> Valores e Impostos
                </h3>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold uppercase">Automático</span>
             </div>
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50/50 text-slate-400 border-b">
                 <tr>
                   <th className="px-6 py-4 font-bold uppercase text-[10px]">Descrição</th>
                   <th className="px-6 py-4 font-bold uppercase text-[10px] text-right">Invoice 100%</th>
                   <th className="px-6 py-4 font-bold uppercase text-[10px] text-right">Invoice 30%</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {/* LINHAS SOLICITADAS ANTERIORMENTE */}
                 <tr className="bg-emerald-50/30">
                   <td className="px-6 py-4 font-bold text-slate-600">Valor Total Produtos (Declarado)</td>
                   <td className="px-6 py-4 text-right text-slate-900 font-bold">R$ {cost100.declaredProductTotalBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                   <td className="px-6 py-4 text-right text-slate-900 font-bold">R$ {cost30.declaredProductTotalBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                 </tr>
                 <tr className="bg-emerald-50/30">
                   <td className="px-6 py-4 font-bold text-slate-600">Valor Total Frete</td>
                   <td className="px-6 py-4 text-right text-slate-900 font-bold">R$ {cost100.freightTotalBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                   <td className="px-6 py-4 text-right text-slate-900 font-bold">R$ {cost30.freightTotalBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                 </tr>
                 {/* LINHAS DE IMPOSTOS */}
                 <tr>
                   <td className="px-6 py-4 font-bold text-slate-600">Imp. de Importação (60%)</td>
                   <td className="px-6 py-4 text-right text-red-600 font-bold">R$ {cost100.importTaxBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                   <td className="px-6 py-4 text-right text-red-600 font-bold">R$ {cost30.importTaxBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                 </tr>
                 <tr>
                   <td className="px-6 py-4 font-bold text-slate-600">ICMS ({inputs.icmsRate}%)</td>
                   <td className="px-6 py-4 text-right text-red-600 font-bold">R$ {cost100.icmsBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                   <td className="px-6 py-4 text-right text-red-600 font-bold">R$ {cost30.icmsBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                 </tr>
                 <tr className="bg-slate-50">
                   <td className="px-6 py-4 font-black text-slate-800 uppercase text-[11px]">Total de Impostos Pagos</td>
                   <td className="px-6 py-4 text-right font-black text-slate-900">R$ {cost100.totalTaxesBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                   <td className="px-6 py-4 text-right font-black text-slate-900">R$ {cost30.totalTaxesBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                 </tr>
                 <tr className="bg-blue-900 text-white">
                   <td className="px-6 py-5 font-black uppercase text-[12px]">Investimento Total na Carga</td>
                   <td className="px-6 py-5 text-right font-black text-amber-400 text-lg">R$ {cost100.totalImportCostBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                   <td className="px-6 py-5 text-right font-black text-emerald-400 text-lg">R$ {cost30.totalImportCostBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                 </tr>
               </tbody>
             </table>
          </div>

          {/* PERFORMANCE NOS MARKETPLACES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* SHOPEE */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-orange-100 border-b-4 border-b-orange-500">
               <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-6 h-6 text-orange-600" />
                    <h4 className="text-orange-600 font-black text-2xl tracking-tighter italic uppercase">SHOPEE</h4>
                  </div>
                  <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    Invoice {activeScenario === Scenario.FULL ? '100%' : '30%'}
                  </div>
               </div>
               <div className="space-y-6">
                 <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 text-xs font-bold uppercase">Preço de Custo</span>
                    <span className="font-black text-slate-700 text-lg">R$ {currentCost.unitCostBRL.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center px-3">
                    <span className="text-slate-400 text-xs font-bold uppercase">Preço de Venda</span>
                    <span className="font-black text-slate-900">R$ {inputs.sellingPriceShopee.toFixed(2)}</span>
                 </div>
                 <div className="pt-6 border-t border-slate-50 flex justify-between items-end">
                   <div>
                     <span className="text-[10px] text-slate-400 block uppercase font-black mb-1">Lucro Líquido</span>
                     <span className="text-3xl font-black text-slate-900">R$ {marginShopee.profit.toFixed(2)}</span>
                   </div>
                   <div className="text-right">
                     <span className="text-[10px] text-slate-400 block uppercase font-black mb-1">Margem %</span>
                     <span className={`text-3xl font-black ${marginShopee.marginPercent > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                       {marginShopee.marginPercent.toFixed(1)}%
                     </span>
                   </div>
                 </div>
               </div>
            </div>

            {/* MERCADO LIVRE */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-yellow-100 border-b-4 border-b-yellow-400">
               <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <Store className="w-6 h-6 text-yellow-600" />
                    <h4 className="text-yellow-600 font-black text-lg tracking-tight italic uppercase">MERCADO LIVRE</h4>
                  </div>
                  <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                    Invoice {activeScenario === Scenario.FULL ? '100%' : '30%'}
                  </div>
               </div>
               <div className="space-y-6">
                 <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 text-[10px] font-bold uppercase">Preço de Custo</span>
                    <span className="font-black text-slate-700 text-base">R$ {currentCost.unitCostBRL.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center px-3">
                    <span className="text-slate-400 text-[10px] font-bold uppercase">Preço de Venda</span>
                    <span className="font-black text-slate-900 text-base">R$ {inputs.sellingPriceML.toFixed(2)}</span>
                 </div>
                 <div className="pt-6 border-t border-slate-50 flex justify-between items-end">
                   <div>
                     <span className="text-[10px] text-slate-400 block uppercase font-black mb-1">Lucro Líquido</span>
                     <span className="text-2xl font-black text-slate-900">R$ {marginML.profit.toFixed(2)}</span>
                   </div>
                   <div className="text-right">
                     <span className="text-[10px] text-slate-400 block uppercase font-black mb-1">Margem %</span>
                     <span className={`text-2xl font-black ${marginML.marginPercent > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                       {marginML.marginPercent.toFixed(1)}%
                     </span>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
