from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import BlogPost
from app.services.instagram import InstagramService

router = APIRouter()


@router.get("/blog/posts")
async def get_blog_posts(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get all blog posts"""
    posts = db.query(BlogPost).order_by(
        BlogPost.published_date.desc()
    ).offset(skip).limit(limit).all()

    return [
        {
            "id": post.id,
            "type": "blog",
            "title": post.title,
            "content": post.content,
            "excerpt": post.excerpt,
            "image_url": post.image_url,
            "author": post.author,
            "published_date": post.published_date.isoformat(),
        }
        for post in posts
    ]


@router.get("/blog/feed")
async def get_unified_feed(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get unified news feed (The Huddle) combining blog posts and Instagram.

    Returns a mixed feed of internal blog posts and Instagram posts,
    sorted by publication date.
    """
    # Get blog posts
    blog_posts = db.query(BlogPost).order_by(
        BlogPost.published_date.desc()
    ).limit(10).all()

    blog_items = [
        {
            "id": f"blog_{post.id}",
            "type": "blog",
            "title": post.title,
            "content": post.content,
            "excerpt": post.excerpt,
            "image_url": post.image_url,
            "author": post.author,
            "published_date": post.published_date.isoformat(),
        }
        for post in blog_posts
    ]

    # Get Instagram posts
    instagram_posts = InstagramService.get_user_media(limit=5)
    instagram_items = [
        InstagramService.format_post_for_feed(post)
        for post in instagram_posts
    ]

    # Combine and sort by date
    all_items = blog_items + instagram_items
    all_items.sort(
        key=lambda x: x.get("published_date", ""),
        reverse=True
    )

    return all_items[skip:skip + limit]
