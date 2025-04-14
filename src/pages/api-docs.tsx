import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ApiDocs = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
          <p className="text-muted-foreground">
            Learn how to integrate with the Chromium Update Server.
          </p>
        </div>

        <Tabs defaultValue="update" className="mb-8">
          <TabsList>
            <TabsTrigger value="update">Update API</TabsTrigger>
            <TabsTrigger value="client">Client Integration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="update" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Update API Endpoint</CardTitle>
                <CardDescription>
                  The main endpoint for Chromium clients to check for updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">URL</h3>
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                    https://your-cloudflare-worker.workers.dev/update
                  </code>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Method</h3>
                  <p>GET</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Query Parameters</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <code className="font-mono text-sm">version</code> - Current version of the client (e.g., 100.0.4896.127)
                    </li>
                    <li>
                      <code className="font-mono text-sm">platform</code> - Client platform (win, mac, linux)
                    </li>
                    <li>
                      <code className="font-mono text-sm">channel</code> - Update channel (stable, beta, dev)
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Response Format</h3>
                  <p className="mb-2">The API returns an XML document following the Omaha protocol:</p>
                  <pre className="rounded bg-muted p-4 font-mono text-sm overflow-x-auto">
{`<?xml version="1.0" encoding="UTF-8"?>
<response protocol="3.0">
  <app appid="chromium">
    <updatecheck status="ok">
      <urls>
        <url codebase="https://download-url.com/chromium-100.0.4896.127.exe"/>
      </urls>
      <manifest version="100.0.4896.127">
        <packages>
          <package name="chromium-100.0.4896.127" hash_sha256="..." size="85432123" required="true"/>
        </packages>
      </manifest>
    </updatecheck>
  </app>
</response>`}
                  </pre>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Example Request</h3>
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                    GET /update?version=100.0.4896.60&platform=win&channel=stable
                  </code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="client" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chromium Client Integration</CardTitle>
                <CardDescription>
                  How to configure your Chromium fork to use this update server
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Update URL Configuration</h3>
                  <p className="mb-2">
                    To configure your Chromium fork to use this update server, you need to modify the update URL in your build configuration.
                  </p>
                  <p className="mb-2">
                    In your Chromium source code, locate the update URL configuration (typically in <code className="font-mono text-sm">chrome/common/chrome_constants.cc</code>) and update it to point to your server:
                  </p>
                  <pre className="rounded bg-muted p-4 font-mono text-sm overflow-x-auto">
{`// chrome/common/chrome_constants.cc

// Change this line:
const char kBrowserUpdateURL[] = "https://tools.google.com/service/update2";

// To:
const char kBrowserUpdateURL[] = "https://your-cloudflare-worker.workers.dev/update";`}
                  </pre>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Testing Updates</h3>
                  <p className="mb-2">
                    To test the update mechanism in your Chromium fork:
                  </p>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Build your Chromium fork with a specific version number</li>
                    <li>Upload the build to GitHub as a release</li>
                    <li>Sync the releases in this update server</li>
                    <li>Launch your Chromium build and trigger an update check</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Forcing Update Checks</h3>
                  <p className="mb-2">
                    In Chromium, you can force an update check by visiting:
                  </p>
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                    chrome://components/
                  </code>
                  <p className="mt-2">
                    Or by launching Chromium with the following command-line flag:
                  </p>
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                    --simulate-update
                  </code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Card>
          <CardHeader>
            <CardTitle>Omaha Protocol</CardTitle>
            <CardDescription>
              Understanding the update protocol used by Chromium
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Chromium uses Google's Omaha protocol for updates. This is an XML-based protocol where:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Clients send their current version, platform, and other metadata
              </li>
              <li>
                The server responds with update information if a newer version is available
              </li>
              <li>
                The response includes download URLs, file sizes, and hash verification data
              </li>
            </ul>
            <p className="mt-4">
              For more detailed information about the Omaha protocol, refer to the 
              <a 
                href="https://github.com/google/omaha/blob/master/doc/ServerProtocolV3.md" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-1"
              >
                official documentation
              </a>.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ApiDocs;