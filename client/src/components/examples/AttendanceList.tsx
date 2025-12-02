import AttendanceList from "../AttendanceList";

export default function AttendanceListExample() {
  return (
    <AttendanceList
      prayer="Dhuhr"
      className="Grade 1"
      onBack={() => console.log("Back clicked")}
    />
  );
}
