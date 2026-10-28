from .base import *  # noqa: F401,F403

# Настоящий хешер паролей специально медленный. В тестах это лишние минуты
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
