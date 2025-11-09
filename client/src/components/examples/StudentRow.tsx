import StudentRow from "../StudentRow";

export default function StudentRowExample() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <StudentRow
        studentId="1"
        studentName="Ahmed Hassan"
        onStatusChange={(status, reason) => console.log("Ahmed:", status, reason)}
      />
      <StudentRow
        studentId="2"
        studentName="Fatima Ali"
        initialStatus="present"
        onStatusChange={(status, reason) => console.log("Fatima:", status, reason)}
      />
      <StudentRow
        studentId="3"
        studentName="Omar Khan"
        initialStatus="absent"
        initialReason="Sick"
        onStatusChange={(status, reason) => console.log("Omar:", status, reason)}
      />
    </div>
  );
}
