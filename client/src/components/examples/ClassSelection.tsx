import ClassSelection from "../ClassSelection";

export default function ClassSelectionExample() {
  return (
    <ClassSelection
      prayer="Dhuhr"
      onClassSelect={(className) => console.log("Selected class:", className)}
      onBack={() => console.log("Back clicked")}
    />
  );
}
