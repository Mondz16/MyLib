using System;
using System.ComponentModel.DataAnnotations;

namespace MyLib.Api.DTOs;

public record LoginDto
(
    [Required][EmailAddress] string Email,
    [Required] string Password
);
