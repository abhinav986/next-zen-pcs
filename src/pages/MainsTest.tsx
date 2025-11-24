import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText } from "lucide-react";
import MainsSubmissionForm from "@/components/mains/MainsSubmissionForm";
import MainsSubmissions from "@/components/mains/MainsSubmissions";

const MainsTest = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Mains Test Series</h1>
          <p className="text-muted-foreground">Upload your answer sheets and track your progress</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Answer Sheet
            </TabsTrigger>
            <TabsTrigger value="submissions" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              My Submissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <Card className="p-6">
              <MainsSubmissionForm onSuccess={() => setActiveTab("submissions")} />
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="mt-6">
            <MainsSubmissions />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MainsTest;
