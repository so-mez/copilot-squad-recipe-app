using Microsoft.EntityFrameworkCore;
using RecipeHub.Api.Data;
using RecipeHub.Api.Dtos;
using RecipeHub.Api.Models;

namespace RecipeHub.Api.Endpoints;

public static class FavoriteEndpoints
{
    // No auth exists; favorites are scoped by an optional header with a single implicit default user.
    private const string UserIdHeader = "X-User-Id";
    private const string DefaultUserId = "default-user";
    private const int MaxUserIdLength = 128;

    public static void MapFavoriteEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/favorites").WithTags("Favorites");

        group.MapGet("/", GetAllAsync);
        group.MapPost("/", AddAsync);
        group.MapDelete("/{recipeId:int}", RemoveAsync);
    }

    private static async Task<IResult> GetAllAsync(HttpContext http, RecipeDbContext db, CancellationToken ct)
    {
        if (!TryResolveUserId(http, out var userId, out var error))
        {
            return error;
        }

        var favorites = await db.Favorites
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .Include(f => f.Recipe!)
                .ThenInclude(r => r.RecipeTags)
                    .ThenInclude(rt => rt.Tag)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(ct);

        return Results.Ok(favorites.Select(f => ToSummaryDto(f.Recipe!)).ToArray());
    }

    private static async Task<IResult> AddAsync(
        AddFavoriteRequest request,
        HttpContext http,
        RecipeDbContext db,
        CancellationToken ct)
    {
        if (!TryResolveUserId(http, out var userId, out var error))
        {
            return error;
        }

        var recipe = await db.Recipes
            .AsNoTracking()
            .Include(r => r.RecipeTags)
                .ThenInclude(rt => rt.Tag)
            .FirstOrDefaultAsync(r => r.Id == request.RecipeId, ct);

        if (recipe is null)
        {
            return Results.NotFound();
        }

        var exists = await db.Favorites
            .AnyAsync(f => f.UserId == userId && f.RecipeId == request.RecipeId, ct);

        if (exists)
        {
            return Results.Ok(ToSummaryDto(recipe));
        }

        db.Favorites.Add(new Favorite
        {
            UserId = userId,
            RecipeId = request.RecipeId,
            CreatedAt = DateTime.UtcNow
        });

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // Concurrent add hit the unique (UserId, RecipeId) index; treat as already favorited.
            return Results.Ok(ToSummaryDto(recipe));
        }

        return Results.Created($"/api/favorites/{request.RecipeId}", ToSummaryDto(recipe));
    }

    private static async Task<IResult> RemoveAsync(
        int recipeId,
        HttpContext http,
        RecipeDbContext db,
        CancellationToken ct)
    {
        if (!TryResolveUserId(http, out var userId, out var error))
        {
            return error;
        }

        if (!await db.Recipes.AnyAsync(r => r.Id == recipeId, ct))
        {
            return Results.NotFound();
        }

        var favorite = await db.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.RecipeId == recipeId, ct);

        if (favorite is not null)
        {
            db.Favorites.Remove(favorite);
            await db.SaveChangesAsync(ct);
        }

        return Results.NoContent();
    }

    private static bool TryResolveUserId(HttpContext http, out string userId, out IResult error)
    {
        var header = http.Request.Headers[UserIdHeader].ToString().Trim();
        userId = string.IsNullOrEmpty(header) ? DefaultUserId : header;
        error = Results.Empty;

        if (userId.Length > MaxUserIdLength)
        {
            error = Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [UserIdHeader] = [$"{UserIdHeader} must be {MaxUserIdLength} characters or fewer."]
            });
            return false;
        }

        return true;
    }

    private static RecipeDto ToSummaryDto(Recipe r) => new(
        r.Id,
        r.Title,
        r.Description,
        r.Difficulty.ToString(),
        r.PrepTimeMinutes,
        r.CookTimeMinutes,
        r.Servings,
        r.ImageUrl,
        r.RecipeTags
            .Where(rt => rt.Tag is not null)
            .Select(rt => rt.Tag!.Name)
            .OrderBy(n => n)
            .ToArray()
    );
}
