from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from .models import Order
from .serializers import OrderSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from API.models import Product
from API.models import Cards ,Address
from .models import *
from .serializers import OrderSerializer

from django.core.mail import send_mail
from django.conf import settings

from django.template.loader import render_to_string

def send_order_notification(order, items, user):
    """
    Sipariş oluşturulduğunda hem kullanıcıya hem admin'e mail gönderir.
    `items` → [(product, qty, price)] formatında olmalı
    """

    # HTML mail içeriğini hazırla
    message_html = render_to_string("emails/order_confirmation.html", {
        "order": order,
        "items": items,
        "user": user
    })

    # 1. Kullanıcıya HTML sipariş özeti
    send_mail(
        subject=f"📦 Sipariş Onayı - #{order.id}",
        message="Sipariş detayları aşağıdadır.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=message_html,
        fail_silently=False
    )

    # 2. Admin'e sade sipariş bildirimi
    subject = f"🛒 Yeni Sipariş Alındı - Sipariş #{order.id}"
    message = f"""
Yeni bir sipariş alındı!

🧾 Sipariş No: {order.id}
👤 Kullanıcı: {user}
📍 Teslimat Adresi: {order.address}
💰 Toplam Tutar: {order.total_amount} ₺
📅 Oluşturulma Tarihi: {order.created_at.strftime('%Y-%m-%d %H:%M')}

Detayları admin panelinden inceleyebilirsiniz.
    """

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=["testflickquest@gmail.com"],  # admin maili
        fail_silently=False
    )



class OrderCreateAPIView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        print("📥 Gelen veri:", request.data)

        data = request.data
        user = request.user

        address_id = data.get("address_id")
        card_id = data.get("card_id")
        product_ids = data.get("products", [])

        if not address_id or not card_id or not product_ids:
            return Response({"error": "Adres, kart ve ürünler zorunludur."}, status=400)

        # adres ve kart kontrolü
        try:
            address = Address.objects.get(id=address_id, user=user)
        except Address.DoesNotExist:
            return Response({"error": "Adres bulunamadı."}, status=404)

        try:
            card = Cards.objects.get(id=card_id, user=user)
        except Cards.DoesNotExist:
            return Response({"error": "Kart bulunamadı."}, status=404)

        print("✅ Adres ve kart başarıyla bulundu")

        # ürünleri say: {3: 2, 7: 1}
        product_map = {}
        for pid in product_ids:
            product_map[pid] = product_map.get(pid, 0) + 1

        total = 0
        items = []

        for pid, qty in product_map.items():
            try:
                product = Product.objects.get(id=pid)
            except Product.DoesNotExist:
                return Response({"error": f"Ürün ID {pid} bulunamadı."}, status=404)

            total += float(product.price) * qty
            items.append((product, qty, product.price))

        # siparişi oluştur
        order = Order.objects.create(
            user=user,
            address=address.full_address,
            total_amount=total
        )

        for product, qty, price in items:
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=qty,
                price_at_order=price
            )
        order = Order.objects.create(
        user=user,
        address=address.full_address,
        total_amount=total
)
        for product, qty, price in items:
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=qty,
                price_at_order=price
            )

        # ✉️ Mail gönder
        send_order_notification(order, items, request.user)
        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)




class OrderDeleteAPIView(generics.DestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        order = self.get_object()

        # sadece sahibi veya admin silebilir
        if request.user != order.user and not request.user.is_superuser:
            return Response({"error": "Bu siparişi silme yetkiniz yok."}, status=403)

        order_id = order.id
        user_email = order.user.email
        total = order.total_amount

        order.delete()

        # ✉️ Mail gönder
        subject = f"❌ Sipariş Silindi - #{order_id}"
        message = f"""
Aşağıdaki sipariş sistemden silindi:

🧾 Sipariş No: {order_id}
👤 Kullanıcı: {request.user}
💰 Tutar: {total} ₺

İşlem sistemde başarıyla tamamlandı.
"""

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email, "testflickquest@gmail.com"],  # kullanıcı + admin
            fail_silently=False,
        )

        return Response({"message": "Sipariş silindi ve mail gönderildi."}, status=200)



# 1. Kullanıcının kendi siparişlerini görmesi ve oluşturması
class UserOrderListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# 2. Admin'in tüm siparişleri görmesi
class AdminOrderListAPIView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]
    queryset = Order.objects.all().order_by('-created_at')

# 3. Sipariş detayı (admin veya siparişi veren kullanıcı)
class OrderDetailAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Order.objects.all()
        return Order.objects.filter(user=user)
    
    
    
    
    
    
    
    
    
    
    
@login_required
def my_orders_view(request):
    return render(request, "my_orders.html")

@login_required
def order_detail_page(request, pk):
    return render(request, "order_detail.html")




@login_required
def Checkout_page(request):
    return render(request, "Checkout.html")





