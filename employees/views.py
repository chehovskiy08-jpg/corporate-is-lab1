import logging

from rest_framework import viewsets

from .models import Employee, Department
from .serializers import EmployeeSerializer, DepartmentSerializer

logger = logging.getLogger(__name__)


class EmployeeViewSet(viewsets.ModelViewSet):
    # Вот здесь мы добавили select_related для исправления N+1
    queryset = Employee.objects.select_related("department")
    serializer_class = EmployeeSerializer

    def perform_create(self, serializer):
        employee = serializer.save()
        logger.info("Создан сотрудник %s (id=%s), пользователь: %s",
                    employee.full_name, employee.id, self.request.user)

    def perform_destroy(self, instance):
        logger.warning("Удалён сотрудник %s (id=%s), пользователь: %s",
                       instance.full_name, instance.id, self.request.user)
        instance.delete()


class DepartmentViewSet(viewsets.ModelViewSet):
    # Убедитесь, что здесь именно Department!
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer