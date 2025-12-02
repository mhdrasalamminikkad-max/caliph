import HomePage from "../HomePage";

export default function HomePageExample() {
  return (
    <HomePage onPrayerSelect={(prayer) => console.log("Selected prayer:", prayer)} />
  );
}
