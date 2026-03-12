import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and application preferences."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
          <p className="text-sm text-muted-foreground">
            Basic application settings. Backend not connected.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Settings will be available when backend is connected.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
