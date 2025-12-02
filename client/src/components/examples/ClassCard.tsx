import ClassCard from "../ClassCard";

export default function ClassCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
      <ClassCard className="Grade 1" studentCount={15} onClick={() => console.log("Grade 1 selected")} lastMarked />
      <ClassCard className="Grade 2" studentCount={15} onClick={() => console.log("Grade 2 selected")} />
      <ClassCard className="Grade 3" studentCount={15} onClick={() => console.log("Grade 3 selected")} lastMarked />
      <ClassCard className="Grade 4" studentCount={15} onClick={() => console.log("Grade 4 selected")} />
    </div>
  );
}
