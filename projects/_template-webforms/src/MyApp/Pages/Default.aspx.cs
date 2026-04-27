using System;

namespace MyApp.Pages
{
    public partial class DefaultPage : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!IsPostBack)
            {
                lblMessage.Text = "Hello from MyApp";
            }
        }
    }
}
