from .models import Category


def categories(request):
    roots = Category.objects.filter(parent__isnull=True).prefetch_related("children")
    return {"menu_categories": roots}
