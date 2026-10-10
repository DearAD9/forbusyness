import asyncio
from sqlalchemy import select
from database import AsyncSessionLocal, init_db
from models import User
from security import get_password_hash

async def seed_development_user():
    print("Initializing database tables...")
    await init_db()

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        existing_users = result.scalars().all()

        if existing_users:
            print(f"Database already has {len(existing_users)} user(s). No seed needed.")
            for u in existing_users:
                print(f" - Found user: {u.username} ({u.email}), role: {u.role}")
            return

        print("No users found in database. Creating initial development user...")
        dev_user = User(
            username="admin",
            email="admin@forbusyness.com",
            password_hash=get_password_hash("Admin@12345"),
            name="ERP Administrator",
            role="admin",
            is_active=True
        )
        session.add(dev_user)
        await session.commit()
        await session.refresh(dev_user)
        print(f"Development user successfully created:")
        print(f"  Username: {dev_user.username}")
        print(f"  Email: {dev_user.email}")
        print(f"  Role: {dev_user.role}")
        print(f"  Default dev password: Admin@12345")

if __name__ == "__main__":
    asyncio.run(seed_development_user())
