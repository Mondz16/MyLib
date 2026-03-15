using System;

namespace MyLib.Api.DTOs;

public record AuthResponseDto(
    string Token,
    DateTime Expiration,
    UserDto User
);

public record UserDto(
    string Id,
    string Email,
    string Username
);
