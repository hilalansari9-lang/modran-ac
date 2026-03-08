import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ACUnitInput {
    temperature: Temperature;
    mode: string;
    name: string;
    sleepMode: boolean;
    fanSpeed: string;
    power: boolean;
}
export interface ACUnit {
    id: bigint;
    temperature: Temperature;
    mode: string;
    name: string;
    isOnline: boolean;
    sleepMode: boolean;
    fanSpeed: string;
    timerOnHours?: Hours;
    power: boolean;
    timerOffHours?: Hours;
}
export type Temperature = bigint;
export type Hours = bigint;
export interface backendInterface {
    addUnit(name: string): Promise<bigint>;
    getAllUnits(): Promise<Array<ACUnit>>;
    getUnit(id: bigint): Promise<ACUnit>;
    removeUnit(id: bigint): Promise<void>;
    renameUnit(id: bigint, newName: string): Promise<void>;
    setTimers(id: bigint, onHours: Hours | null, offHours: Hours | null): Promise<void>;
    toggleOnlineStatus(id: bigint): Promise<void>;
    updateUnit(id: bigint, input: ACUnitInput): Promise<void>;
}
