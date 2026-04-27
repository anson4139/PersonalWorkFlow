using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MyApp;

static class Program
{
    public static IServiceProvider Services { get; private set; } = null!;

    [STAThread]
    static void Main()
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("APP_ENV") ?? "Development"}.json", optional: true)
            .Build();

        var services = new ServiceCollection();
        ConfigureServices(services, config);
        Services = services.BuildServiceProvider();

        ApplicationConfiguration.Initialize();
        Application.Run(Services.GetRequiredService<Forms.MainForm>());
    }

    static void ConfigureServices(IServiceCollection services, IConfiguration config)
    {
        services.AddSingleton<IConfiguration>(config);

        // Register forms
        services.AddTransient<Forms.MainForm>();

        // Register services
        // services.AddScoped<IMyService, MyService>();
    }
}
