import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, GraduationCap, School, Calendar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserManagement from "@/components/admin/UserManagement";
import StudentManagement from "@/components/admin/StudentManagement";
import ClassManagement from "@/components/admin/ClassManagement";
import AttendanceEditor from "@/components/admin/AttendanceEditor";
import BackdatedAttendance from "@/components/admin/BackdatedAttendance";

interface AdminPanelProps {
  onExit?: () => void;
}

export default function AdminPanel({ onExit }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState("users");

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      // Fallback - reload the page to go back to home
      window.location.href = "/";
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" data-testid="icon-admin-shield" />
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-admin-title">Admin Panel</h1>
              <p className="text-muted-foreground" data-testid="text-admin-subtitle">
                Manage users, students, classes, and attendance
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleExit}
            data-testid="button-exit-admin"
          >
            Exit Admin Panel
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5" data-testid="tabs-admin-navigation">
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="students" data-testid="tab-students">
              <GraduationCap className="w-4 h-4 mr-2" />
              Students
            </TabsTrigger>
            <TabsTrigger value="classes" data-testid="tab-classes">
              <School className="w-4 h-4 mr-2" />
              Classes
            </TabsTrigger>
            <TabsTrigger value="attendance-editor" data-testid="tab-attendance-editor">
              <Calendar className="w-4 h-4 mr-2" />
              Edit Attendance
            </TabsTrigger>
            <TabsTrigger value="backdated-attendance" data-testid="tab-backdated-attendance">
              <Calendar className="w-4 h-4 mr-2" />
              Add Past Attendance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <StudentManagement />
          </TabsContent>

          <TabsContent value="classes" className="space-y-4">
            <ClassManagement />
          </TabsContent>

          <TabsContent value="attendance-editor" className="space-y-4">
            <AttendanceEditor />
          </TabsContent>

          <TabsContent value="backdated-attendance" className="space-y-4">
            <BackdatedAttendance />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
