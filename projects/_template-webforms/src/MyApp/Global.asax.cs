using System;
using System.Web;

namespace MyApp
{
    public class Global : HttpApplication
    {
        protected void Application_Start(object sender, EventArgs e)
        {
            // Application startup logic
        }

        protected void Application_End(object sender, EventArgs e)
        {
            // Cleanup logic
        }

        protected void Application_Error(object sender, EventArgs e)
        {
            Exception ex = Server.GetLastError();
            // Log error: ex.Message
        }
    }
}
