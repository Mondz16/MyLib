using System;
using System.ComponentModel.DataAnnotations;

namespace MyLib.Api.DTOs;

public record RegisterDto
(
    [Required][EmailAddress] string Email,
    [Required][MinLength(8)] string Password,
    [Required] string Username 
);
