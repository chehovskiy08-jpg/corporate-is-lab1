from django.db import models


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Employee(models.Model):
    full_name = models.CharField(max_length=200)
    position = models.CharField(max_length=100)
    hired_at = models.DateField()
    # SET_NULL: при удалении отдела сотрудники остаются в базе,
    # но без привязки к отделу. Это безопаснее, чем CASCADE,
    # потому что удаление отдела не должно удалять людей.
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees",
    )

    def __str__(self):
        return self.full_name