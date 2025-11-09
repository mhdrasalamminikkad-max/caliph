import PrayerButton from "../PrayerButton";

export default function PrayerButtonExample() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      <PrayerButton prayer="Fajr" onClick={() => console.log("Fajr selected")} />
      <PrayerButton prayer="Dhuhr" onClick={() => console.log("Dhuhr selected")} />
      <PrayerButton prayer="Asr" onClick={() => console.log("Asr selected")} />
      <PrayerButton prayer="Maghrib" onClick={() => console.log("Maghrib selected")} />
      <PrayerButton prayer="Isha" onClick={() => console.log("Isha selected")} />
    </div>
  );
}
