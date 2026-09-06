import type { BulkDensityCalculation, BulkDensityTestData } from "@/types";
import { round } from "@/lib/math";

export function initialBulkDensityData(): BulkDensityTestData {
  return { containerVolumeL:null, containerMassKg:null, containerPlusAggregateKg:null };
}

export function calculateBulkDensity(data:BulkDensityTestData|undefined):BulkDensityCalculation{
  const d=data??initialBulkDensityData();
  if(d.containerVolumeL===null||d.containerMassKg===null||d.containerPlusAggregateKg===null||d.containerVolumeL<=0||d.containerPlusAggregateKg<=d.containerMassKg){
    return {aggregateMassKg:null,resultKgM3:null,overallStatus:"PENDENTE",complete:false};
  }
  const mass=round(d.containerPlusAggregateKg-d.containerMassKg,3);
  const result=round(mass/(d.containerVolumeL/1000),0);
  return {aggregateMassKg:mass,resultKgM3:result,overallStatus:result>=1250?"CONFORME":"NÃO CONFORME",complete:true};
}
