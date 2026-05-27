"""Pagination helper."""


def paginate_meta(page: int, limit: int, total: int) -> dict:
    pages = max(1, (total + limit - 1) // limit) if limit > 0 else 1
    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": pages,
        "has_next": page < pages,
        "has_prev": page > 1,
    }
