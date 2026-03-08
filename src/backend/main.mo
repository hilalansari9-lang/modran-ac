import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";

actor {
  type Temperature = Nat;
  type Hours = Nat;

  type ACUnit = {
    id : Nat;
    name : Text;
    power : Bool;
    mode : Text;
    fanSpeed : Text;
    temperature : Temperature;
    timerOnHours : ?Hours;
    timerOffHours : ?Hours;
    sleepMode : Bool;
    isOnline : Bool;
  };

  module ACUnit {
    public func compare(ac1 : ACUnit, ac2 : ACUnit) : Order.Order {
      Nat.compare(ac1.id, ac2.id);
    };
  };

  type ACUnitInput = {
    name : Text;
    power : Bool;
    mode : Text;
    fanSpeed : Text;
    temperature : Temperature;
    sleepMode : Bool;
  };

  let units = Map.empty<Nat, ACUnit>();
  var nextId = 1;

  let livingRoom : ACUnit = {
    id = 0;
    name = "Living Room";
    power = false;
    mode = "Cool";
    fanSpeed = "Medium";
    temperature = 24;
    timerOnHours = null;
    timerOffHours = null;
    sleepMode = false;
    isOnline = true;
  };

  let bedroom : ACUnit = {
    id = 1;
    name = "Bedroom";
    power = false;
    mode = "Cool";
    fanSpeed = "Medium";
    temperature = 24;
    timerOnHours = null;
    timerOffHours = null;
    sleepMode = false;
    isOnline = true;
  };

  public shared ({ caller }) func addUnit(name : Text) : async Nat {
    if (name.isEmpty()) { Runtime.trap("Name cannot be empty.") };

    let id = nextId;
    switch (units.get(id)) {
      case (null) {
        let newUnit : ACUnit = {
          id;
          name;
          power = false;
          mode = "Cool";
          fanSpeed = "Medium";
          temperature = 24;
          timerOnHours = null;
          timerOffHours = null;
          sleepMode = false;
          isOnline = true;
        };

        units.add(id, newUnit);
        nextId += 1;
        id;
      };
      case (?_) { Runtime.trap("ID already exists. This should not happen.") };
    };
  };

  public shared ({ caller }) func removeUnit(id : Nat) : async () {
    if (id == 0 or id == 1) { Runtime.trap("Cannot remove default units") };

    if (not units.containsKey(id)) { Runtime.trap("Unit with id " # id.toText() # " does not exist") };

    units.remove(id);
  };

  public shared ({ caller }) func renameUnit(id : Nat, newName : Text) : async () {
    if (newName.isEmpty()) { Runtime.trap("Name cannot be empty.") };

    switch (units.get(id)) {
      case (null) { Runtime.trap("Unit with id " # id.toText() # " does not exist") };
      case (?unit) {
        let updatedUnit : ACUnit = {
          id = unit.id;
          name = newName;
          power = unit.power;
          mode = unit.mode;
          fanSpeed = unit.fanSpeed;
          temperature = unit.temperature;
          timerOnHours = unit.timerOnHours;
          timerOffHours = unit.timerOffHours;
          sleepMode = unit.sleepMode;
          isOnline = unit.isOnline;
        };
        units.add(id, updatedUnit);
      };
    };
  };

  public query ({ caller }) func getAllUnits() : async [ACUnit] {
    let defaultUnits : [ACUnit] = [livingRoom, bedroom];
    let customUnits = units.values().toArray();
    defaultUnits.concat(customUnits).sort();
  };

  public query ({ caller }) func getUnit(id : Nat) : async ACUnit {
    switch (id) {
      case (0) { livingRoom };
      case (1) { bedroom };
      case (_) {
        switch (units.get(id)) {
          case (null) { Runtime.trap("Unit with id " # id.toText() # " does not exist") };
          case (?unit) { unit };
        };
      };
    };
  };

  public shared ({ caller }) func updateUnit(id : Nat, input : ACUnitInput) : async () {
    if (input.name.isEmpty()) { Runtime.trap("Name cannot be empty.") };
    if (input.temperature > 30 or input.temperature < 16) { Runtime.trap("Temperature must be between 16 and 30") };

    switch (id) {
      case (0) {
        let updatedUnit : ACUnit = {
          livingRoom with name = input.name;
          power = input.power;
          mode = input.mode;
          fanSpeed = input.fanSpeed;
          temperature = input.temperature;
          sleepMode = input.sleepMode;
        };
        units.add(0, updatedUnit);
      };
      case (1) {
        let updatedUnit : ACUnit = {
          bedroom with name = input.name;
          power = input.power;
          mode = input.mode;
          fanSpeed = input.fanSpeed;
          temperature = input.temperature;
          sleepMode = input.sleepMode;
        };
        units.add(1, updatedUnit);
      };
      case (_) {
        switch (units.get(id)) {
          case (null) { Runtime.trap("Unit with id " # id.toText() # " does not exist") };
          case (?_) {
            let updatedUnit : ACUnit = {
              id;
              name = input.name;
              power = input.power;
              mode = input.mode;
              fanSpeed = input.fanSpeed;
              temperature = input.temperature;
              timerOnHours = null;
              timerOffHours = null;
              sleepMode = input.sleepMode;
              isOnline = true;
            };
            units.add(id, updatedUnit);
          };
        };
      };
    };
  };

  public shared ({ caller }) func setTimers(id : Nat, onHours : ?Hours, offHours : ?Hours) : async () {
    if (onHours.isSome() and onHours.unwrap() <= 0) {
      Runtime.trap("Timer on hours must be greater than 0");
    };
    if (offHours.isSome() and offHours.unwrap() <= 0) {
      Runtime.trap("Timer off hours must be greater than 0");
    };

    switch (id) {
      case (0) { Runtime.trap("Cannot set timers for default unit") };
      case (1) { Runtime.trap("Cannot set timers for default unit") };
      case (_) {
        switch (units.get(id)) {
          case (null) { Runtime.trap("Unit with id " # id.toText() # " does not exist") };
          case (?unit) {
            let updatedUnit : ACUnit = {
              id = unit.id;
              name = unit.name;
              power = unit.power;
              mode = unit.mode;
              fanSpeed = unit.fanSpeed;
              temperature = unit.temperature;
              timerOnHours = onHours;
              timerOffHours = offHours;
              sleepMode = unit.sleepMode;
              isOnline = unit.isOnline;
            };
            units.add(id, updatedUnit);
          };
        };
      };
    };
  };

  public shared ({ caller }) func toggleOnlineStatus(id : Nat) : async () {
    switch (id) {
      case (0) { Runtime.trap("Cannot toggle online status for default unit") };
      case (1) { Runtime.trap("Cannot toggle online status for default unit") };
      case (_) {
        switch (units.get(id)) {
          case (null) { Runtime.trap("Unit with id " # id.toText() # " does not exist") };
          case (?unit) {
            let updatedUnit : ACUnit = {
              id = unit.id;
              name = unit.name;
              power = unit.power;
              mode = unit.mode;
              fanSpeed = unit.fanSpeed;
              temperature = unit.temperature;
              timerOnHours = unit.timerOnHours;
              timerOffHours = unit.timerOffHours;
              sleepMode = unit.sleepMode;
              isOnline = not unit.isOnline;
            };
            units.add(id, updatedUnit);
          };
        };
      };
    };
  };
};
