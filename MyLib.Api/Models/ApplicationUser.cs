using Microsoft.AspNetCore.Identity;

namespace MyLib.Api.Models;

public class ApplicationUser : IdentityUser
{
    public DateTime CreatedAt {get;set;} = DateTime.UtcNow;
}
